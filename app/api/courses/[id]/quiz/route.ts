import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export const runtime = 'nodejs'
export const maxDuration = 30

interface RequestBody {
  title: string
  description: string
  youtubeUrl?: string
}

const QUIZ_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['multiple-choice', 'ox', 'short-answer'] },
          question: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' } },
          correctAnswer: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['id', 'type', 'question', 'correctAnswer'],
      },
    },
  },
  required: ['questions'],
}

// 폴백 체인 — 최신부터 stable 순으로
const MODEL_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-002',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
]

function buildPrompt(title: string, description: string, transcript: string) {
  return `당신은 교육용 퀴즈 출제자입니다. 아래 강좌 내용을 바탕으로 학습 이해도를 확인할 수 있는 퀴즈 3문제를 만드세요.

[강좌 제목]
${title}

[강좌 설명]
${description || '(설명 없음)'}
${transcript ? `\n[강좌 자막]\n${transcript}` : ''}

요구사항:
- 1번 문제는 "multiple-choice" (4지선다, 4개 선택지 중 1개 정답)
- 2번 문제는 "ox" (참/거짓)
- 3번 문제는 "short-answer" (한 문장 이내 주관식)
- 모든 문제는 강좌의 핵심 개념을 다뤄야 하며 한국어로 출제
- 너무 쉽거나 너무 사소한 디테일을 묻지 말 것
- explanation 필드에는 정답에 대한 짧은 해설 작성

correctAnswer 규칙:
- multiple-choice: 정답의 인덱스를 문자열로 ("0", "1", "2", "3"), choices는 4개
- ox: "O" 또는 "X", choices는 ["O", "X"]
- short-answer: 모범답안 (한 문장), choices는 빈 배열 또는 생략`
}

// 직접 REST 호출 — SDK 의존성 없음
async function callGeminiRest(apiKey: string, modelName: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: QUIZ_SCHEMA,
        temperature: 0.7,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // Gemini 에러 응답: { error: { code, message, status } }
    let parsed: any = null
    try { parsed = JSON.parse(text) } catch {}
    const apiMsg = parsed?.error?.message || text || `HTTP ${res.status}`
    throw new Error(`[${res.status}] ${apiMsg}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답에 텍스트가 없습니다')
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
    throw new Error('퀴즈 questions 배열이 비어 있음')
  }
  return parsed.questions
}

// 모델 체인 폴백 — "모델 없음" 에러만 다음으로 넘어감
async function generateWithFallback(apiKey: string, prompt: string): Promise<{ questions: unknown[]; modelUsed: string; triedModels: string[] }> {
  const tried: string[] = []
  let lastError: unknown = null
  for (const modelName of MODEL_CHAIN) {
    tried.push(modelName)
    try {
      const questions = await callGeminiRest(apiKey, modelName, prompt)
      return { questions, modelUsed: modelName, triedModels: tried }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      console.warn(`[quiz] 모델 ${modelName} 실패:`, m)
      lastError = e
      // 404 / 모델 미지원 / NOT_FOUND 면 다음 모델로
      if (/404|not.?found|unsupported|invalid.?model|is not supported/i.test(m)) {
        continue
      }
      // 429 (쿼터)는 다른 모델도 마찬가지일 가능성 — 그만 시도
      if (/429|quota|rate.?limit|resource_exhausted/i.test(m)) {
        throw e
      }
      // 그 외(인증/타임아웃/JSON) — 같은 카테고리로 throw
      throw e
    }
  }
  throw lastError || new Error('모든 모델이 사용 불가능합니다')
}

export async function POST(
  req: NextRequest,
  _ctx: { params: { id: string } }
) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다' },
      { status: 500 }
    )
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 })
  }

  const { title, description, youtubeUrl } = body
  if (!title) {
    return NextResponse.json({ error: '강좌 정보가 부족합니다' }, { status: 400 })
  }

  let transcript = ''
  let transcriptError = ''
  if (youtubeUrl) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(youtubeUrl)
      transcript = items.map((x) => x.text).join(' ')
      if (transcript.length > 8000) transcript = transcript.slice(0, 8000)
    } catch (e) {
      transcriptError = e instanceof Error ? e.message : String(e)
      console.warn('[quiz] 자막 추출 실패:', transcriptError)
    }
  }

  const prompt = buildPrompt(title, description, transcript)

  let lastError: unknown = null
  let triedModels: string[] = []
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { questions, modelUsed, triedModels: tried } = await generateWithFallback(apiKey, prompt)
      triedModels = tried
      return NextResponse.json({
        questions,
        meta: {
          attempt,
          modelUsed,
          triedModels: tried,
          transcriptUsed: transcript.length > 0,
          transcriptError: transcriptError || undefined,
        },
      })
    } catch (error) {
      lastError = error
      console.error(`[quiz] 시도 ${attempt} 실패:`, error)
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 800))
      }
    }
  }

  const errMsg = lastError instanceof Error ? lastError.message : String(lastError)
  const detailed = classifyError(errMsg)

  return NextResponse.json(
    {
      error: detailed.userMessage,
      detail: errMsg,
      kind: detailed.kind,
      triedModels,
      transcriptError: transcriptError || undefined,
    },
    { status: detailed.status }
  )
}

function classifyError(msg: string): { kind: string; userMessage: string; status: number } {
  const lower = msg.toLowerCase()
  if (/429|resource_exhausted|quota|rate.?limit/i.test(msg)) {
    return {
      kind: 'rate_limit',
      userMessage: 'Gemini API 사용 한도(쿼터)에 도달했습니다. 잠시 후 다시 시도해주세요.',
      status: 429,
    }
  }
  if (/api_key|api key|permission_denied|403|unauthorized|401|invalid.?key/i.test(lower)) {
    return {
      kind: 'auth',
      userMessage: 'Gemini API 키가 유효하지 않거나 권한이 없습니다. Google Cloud에서 키와 결제 계정 연결을 확인하세요.',
      status: 401,
    }
  }
  if (/404|not.?found|unsupported|invalid.?model|is not supported/i.test(lower)) {
    return {
      kind: 'model_not_found',
      userMessage: '모든 Gemini 모델이 이 API 키로 호출 불가능합니다. API 키의 프로젝트가 Generative Language API를 활성화했는지 확인하세요.',
      status: 502,
    }
  }
  if (/token|context.?length|input.?too.?long/i.test(lower)) {
    return { kind: 'token_limit', userMessage: '강좌 자료가 너무 길어 Gemini 컨텍스트 한도를 넘었습니다.', status: 413 }
  }
  if (/json|unexpected.?token|parse/i.test(lower)) {
    return { kind: 'parse_error', userMessage: 'AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.', status: 502 }
  }
  if (/timeout|aborted/i.test(lower)) {
    return { kind: 'timeout', userMessage: '응답 시간 초과. 잠시 후 다시 시도해주세요.', status: 504 }
  }
  return {
    kind: 'unknown',
    userMessage: `퀴즈 생성 실패: ${msg.slice(0, 300)}`,
    status: 500,
  }
}
