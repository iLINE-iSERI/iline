import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { YoutubeTranscript } from 'youtube-transcript'

export const runtime = 'nodejs'
export const maxDuration = 30

interface RequestBody {
  title: string
  description: string
  youtubeUrl?: string
}

// 응답 강제 스키마 — Gemini가 이 스키마에 맞는 JSON만 반환하도록 강제
const QUIZ_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING, enum: ['multiple-choice', 'ox', 'short-answer'] },
          question: { type: SchemaType.STRING },
          choices: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          correctAnswer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ['id', 'type', 'question', 'correctAnswer'],
      },
    },
  },
  required: ['questions'],
}

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

// Gemini 호출 + 파싱 (1번 시도)
async function generateOnce(apiKey: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: QUIZ_SCHEMA,
      temperature: 0.7,
    },
  })
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
    throw new Error('퀴즈 questions 배열이 비어 있음')
  }
  return parsed.questions
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

  // YouTube 자막 추출 시도 (실패해도 계속 진행)
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

  // 1차 시도 + 실패 시 1회 자동 재시도
  let lastError: unknown = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const questions = await generateOnce(apiKey, prompt)
      return NextResponse.json({
        questions,
        // 디버깅 정보 (개발자 콘솔용)
        meta: {
          attempt,
          transcriptUsed: transcript.length > 0,
          transcriptError: transcriptError || undefined,
        },
      })
    } catch (error) {
      lastError = error
      console.error(`[quiz] 시도 ${attempt} 실패:`, error)
      // 마지막 시도가 아니면 짧게 대기 후 재시도
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 800))
      }
    }
  }

  // 두 번 다 실패한 경우 — 에러 분류해서 명확한 메시지 전달
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError)
  const detailed = classifyError(errMsg)

  return NextResponse.json(
    {
      error: detailed.userMessage,
      detail: errMsg,
      kind: detailed.kind,
      transcriptError: transcriptError || undefined,
    },
    { status: detailed.status }
  )
}

function classifyError(msg: string): { kind: string; userMessage: string; status: number } {
  const lower = msg.toLowerCase()
  // 쿼터/레이트리밋
  if (/429|resource_exhausted|quota|rate.?limit/i.test(msg)) {
    return {
      kind: 'rate_limit',
      userMessage: 'Gemini API 사용 한도(쿼터)에 도달했습니다. 잠시 후 다시 시도해주세요. (분당/일별 무료 요청 한도 초과)',
      status: 429,
    }
  }
  // API 키 문제
  if (/api_key|api key|permission_denied|403|unauthorized|401/i.test(lower)) {
    return {
      kind: 'auth',
      userMessage: 'Gemini API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인하세요.',
      status: 401,
    }
  }
  // 모델 미존재
  if (/not.?found|404|model/i.test(lower) && /not/i.test(lower)) {
    return {
      kind: 'model_not_found',
      userMessage: 'Gemini 모델 이름이 잘못되었습니다. 코드를 점검하세요.',
      status: 502,
    }
  }
  // 토큰/컨텍스트 초과
  if (/token|context.?length|input.?too.?long/i.test(lower)) {
    return {
      kind: 'token_limit',
      userMessage: '강좌 자료가 너무 길어 Gemini 컨텍스트 한도를 넘었습니다.',
      status: 413,
    }
  }
  // JSON 파싱 실패
  if (/json|unexpected.?token|parse/i.test(lower)) {
    return {
      kind: 'parse_error',
      userMessage: 'AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.',
      status: 502,
    }
  }
  // 타임아웃
  if (/timeout|aborted/i.test(lower)) {
    return {
      kind: 'timeout',
      userMessage: '응답 시간 초과. 잠시 후 다시 시도해주세요.',
      status: 504,
    }
  }
  return {
    kind: 'unknown',
    userMessage: `퀴즈 생성 실패: ${msg.slice(0, 200)}`,
    status: 500,
  }
}
