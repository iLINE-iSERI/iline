'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getQnAs, createQnA, answerQnA, deleteQnA } from '@/lib/firebase/firestore'
import type { QnA } from '@/lib/types'

export default function QnAPage() {
  const { user, userProfile } = useAuth()
  const [qnas, setQnas] = useState<QnA[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')

  useEffect(() => {
    loadQnAs()
  }, [])

  const loadQnAs = async () => {
    try {
      const data = await getQnAs()
      setQnas(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !userProfile || !title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      await createQnA({ title: title.trim(), content: content.trim(), authorId: user.uid, authorName: userProfile?.name || user.displayName || '익명' })
      setTitle('')
      setContent('')
      await loadQnAs()
    } catch (e) { alert('질문 등록 실패') }
    finally { setSubmitting(false) }
  }

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) return
    try {
      await answerQnA(id, answerText.trim())
      setAnsweringId(null)
      setAnswerText('')
      await loadQnAs()
    } catch (e) { alert('답변 등록 실패') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await deleteQnA(id)
      await loadQnAs()
    } catch (e) { alert('삭제 실패') }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[1,2,3].map(i=><div key={i} className="h-24 bg-gray-200 rounded-lg"/>)}</div></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Q&A</h1>

      {user && userProfile && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">질문하기</h2>
          <input type="text" placeholder="제목" value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" required />
          <textarea placeholder="내용을 입력하세요" value={content} onChange={e=>setContent(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" rows={4} required />
          <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition">
            {submitting ? '등록 중...' : '질문 등록'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {qnas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500">아직 질문이 없습니다</p></div>
        ) : qnas.map(q => (
          <div key={q.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{q.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${q.answer ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {q.answer ? '답변완료' : '대기중'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{q.authorName} · {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleDateString('ko-KR') : ''}</p>
              </div>
              {(user?.uid === q.authorId || userProfile?.role === 'admin') && (
                <button onClick={()=>handleDelete(q.id)} className="text-red-500 hover:text-red-700 text-sm">삭제</button>
              )}
            </div>
            <p className="text-gray-700 mt-3 whitespace-pre-wrap">{q.content}</p>

            {q.answer && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-blue-700 mb-1">답변</p>
                <p className="text-gray-700 whitespace-pre-wrap">{q.answer}</p>
              </div>
            )}

            {!q.answer && userProfile?.role === 'admin' && (
              <div className="mt-4">
                {answeringId === q.id ? (
                  <div>
                    <textarea value={answerText} onChange={e=>setAnswerText(e.target.value)} placeholder="답변을 입력하세요" className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
                    <div className="flex gap-2">
                      <button onClick={()=>handleAnswer(q.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1.5 px-4 rounded-lg">등록</button>
                      <button onClick={()=>{setAnsweringId(null);setAnswerText('')}} className="bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold py-1.5 px-4 rounded-lg">취소</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={()=>setAnsweringId(q.id)} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">답변 작성</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
