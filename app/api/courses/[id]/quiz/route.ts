import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { YoutubeTranscript } from 'youtube-transcript'

export const runtime = 'nodejs'
export const maxDuration = 30

interface RequestBody {
  title: string
  description: string
  youtubeUrl?: string
}

export async function POST(
  req: NextRequest,
  _ctx: { params: { id: string } }
) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // 임시 진단 코드 — 환경변수 문제 해결 후 제거 예정
    const relatedKeys = Object.keys(process.env).filter(
      (k) => k.toUpperCase().includes('GEMINI') || k.toUpperCase().includes('GOOGLE')
    )
    return NextResponse.json(
      {
        error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다',
        debug: {
          relatedEnvKeys: relatedKeys,
          rawHasGeminiApiKey: 'GEMINI_API_KEY' in process.env,
          vercelEnv: process.env.VERCEL_ENV ?? null,
          nodeEnv: process.env.NODE_ENV ?? null,
          deploymentUrl: process.env.VERCEL_URL ?? null,
        },
      },
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
  if (youtubeUrl) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(youtubeUrl)
      transcript = items.map((x) => x.text).join(' ')
      // 컨텍스트 절약: 최대 ~8000자 (대략 4000~5000 토큰)
      if (transcript.length > 8000) transcript = transcript.slice(0, 8000)
    } catch (e) {
      // 자막 없거나 추출 실패 — 제목/설명만 사용
      console.warn('자막 추출 실패:', e instanceof Error ? e.message : e)
    }
  }

  const prompt = `당신은 교육용 퀴즈 출제자입니다. 아래 강좌 내용을 바탕으로 학습 이해도를 확인할 수 있는 퀴즈 3문제를 만드세요.

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

응답은 반드시 아래 JSON 형식 그대로 반환:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "...",
      "choices": ["...", "...", "...", "..."],
      "correctAnswer": "0",
      "explanation": "..."
    },
    {
      "id": "q2",
      "type": "ox",
      "question": "...",
      "choices": ["O", "X"],
      "correctAnswer": "O",
      "explanation": "..."
    },
    {
      "id": "q3",
      "type": "short-answer",
      "question": "...",
      "correctAnswer": "모범답안 텍스트",
      "explanation": "..."
    }
  ]
}

correctAnswer 규칙:
- multiple-choice: 정답의 인덱스를 문자열로 ("0", "1", "2", "3")
- ox: "O" 또는 "X"
- short-answer: 모범답안 (한 문장)

반드시 위 JSON만 반환하고 다른 텍스트는 포함하지 마세요.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text)

    if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
      return NextResponse.json(
        { error: '퀴즈 형식이 올바르지 않습니다' },
        { status: 502 }
      )
    }

    return NextResponse.json({ questions: parsed.questions })
  } catch (error) {
    console.error('퀴즈 생성 에러:', error)
    // 임시 진단 코드 — 정상화 후 제거 예정
    const errorInfo =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { raw: String(error) }
    return NextResponse.json(
      {
        error: '퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
        debug: errorInfo,
      },
      { status: 500 }
    )
  }
}
