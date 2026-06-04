'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPost, updatePost } from '@/lib/firebase/firestore';
import { uploadPostImage } from '@/lib/firebase/storage';
import RichTextEditor from '@/components/editor/RichTextEditor';

interface Props { params: { id: string } }
const MAX_ATTACHMENTS = 10;

function EditNoticeContent({ id }: { id: string }) {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      router.push(`/board/notice/${id}`);
    }
  }, [authLoading, userProfile, router, id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    getPost(id).then((post) => {
      if (!alive) return;
      if (!post || post.type !== 'notice') { setNotFound(true); setLoading(false); return; }
      setTitle(post.title);
      setContent(post.content || '');
      // 옛 단일 필드 + 새 배열 머지 (중복 제거)
      const merged = Array.from(new Set([
        ...(post.attachmentUrls || []),
        ...(post.attachmentUrl ? [post.attachmentUrl] : []),
      ])).filter(Boolean) as string[];
      setAttachmentUrls(merged);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  const remaining = MAX_ATTACHMENTS - attachmentUrls.length;
  const reachedMax = attachmentUrls.length >= MAX_ATTACHMENTS;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    if (files.length > remaining) {
      alert(`최대 ${MAX_ATTACHMENTS}개까지 첨부 가능합니다. 추가로 가능한 개수: ${remaining}개`);
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadPostImage(f, 'notice')));
      setAttachmentUrls(prev => [...prev, ...urls]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (reachedMax) { alert(`최대 ${MAX_ATTACHMENTS}개까지 가능합니다`); return; }
    setAttachmentUrls(prev => [...prev, url]);
    setUrlInput('');
  };

  const removeAttachment = (idx: number) => {
    setAttachmentUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const moveAttachment = (idx: number, direction: -1 | 1) => {
    const next = idx + direction;
    if (next < 0 || next >= attachmentUrls.length) return;
    const arr = [...attachmentUrls];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setAttachmentUrls(arr);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('제목을 입력하세요'); return; }
    const plain = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!plain) { alert('내용을 입력하세요'); return; }
    setSaving(true);
    try {
      await updatePost(id, {
        title: title.trim(),
        content: content,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        // 호환 — 첫 번째 이미지를 옛 단일 필드에도 저장 (목록 썸네일에서 사용)
        attachmentUrl: attachmentUrls[0] || undefined,
      });
      router.push(`/board/notice/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`저장 실패: ${msg}`);
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-32 bg-gray-200 animate-pulse rounded-xl" /></div>;
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">공지를 찾을 수 없습니다</p>
        <button onClick={() => router.push('/board/notice')} className="text-blue-600 hover:text-blue-700 font-semibold">
          공지사항 목록으로
        </button>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push(`/board/notice/${id}`)}
        className="text-blue-600 hover:text-blue-700 font-semibold mb-6"
      >
        ← 공지 상세로 돌아가기
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">공지 수정</h1>
      <p className="text-gray-500 mb-8">제목, 본문, 첨부 이미지를 모두 수정할 수 있어요.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">제목 *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">내용 *</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="이벤트 안내를 작성하세요." minHeight={320} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            첨부 이미지 (선택, {attachmentUrls.length}/{MAX_ATTACHMENTS})
          </label>

          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
              placeholder="이미지 URL 직접 추가 (Enter) 또는 우측 파일 선택"
              disabled={reachedMax}
              className={`${inputClass} flex-grow disabled:bg-gray-100 disabled:text-gray-400`}
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || reachedMax}
              className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-medium rounded-xl transition text-sm"
            >
              URL 추가
            </button>
            <label
              className={`flex-shrink-0 px-4 py-2 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition ${
                uploading
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                  : reachedMax
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-purple-300 text-purple-600 hover:bg-purple-50'
              }`}
            >
              {uploading ? '업로드 중...' : reachedMax ? '최대치' : '📁 파일 선택'}
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={uploading || reachedMax} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            최대 {MAX_ATTACHMENTS}개 · 각 5MB 이하 · 첫 번째 이미지가 목록 썸네일로 사용됩니다 (◀▶로 순서 변경)
          </p>

          {attachmentUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {attachmentUrls.map((url, idx) => (
                <div key={url + idx} className="relative group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`첨부 ${idx + 1}`}
                    className="w-full h-24 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                  />
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    {idx + 1}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex gap-0.5 p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <button type="button" onClick={() => moveAttachment(idx, -1)} disabled={idx === 0} className="text-white text-xs px-1 hover:text-purple-200 disabled:text-gray-400" title="앞으로">◀</button>
                    <button type="button" onClick={() => moveAttachment(idx, 1)} disabled={idx === attachmentUrls.length - 1} className="text-white text-xs px-1 hover:text-purple-200 disabled:text-gray-400" title="뒤로">▶</button>
                    <div className="flex-grow" />
                    <button type="button" onClick={() => removeAttachment(idx)} className="text-white text-xs px-1 hover:text-red-300" title="제거">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
          <button
            onClick={() => router.push(`/board/notice/${id}`)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditNoticePage({ params }: Props) {
  return (
    <AuthGuard>
      <EditNoticeContent id={params.id} />
    </AuthGuard>
  );
}
