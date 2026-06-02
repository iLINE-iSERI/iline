'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPost, updatePost } from '@/lib/firebase/firestore';
import { uploadPostImage } from '@/lib/firebase/storage';
import RichTextEditor from '@/components/editor/RichTextEditor';

interface Props { params: { id: string } }

function EditNoticeContent({ id }: { id: string }) {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
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
      setAttachmentUrl(post.attachmentUrl || '');
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPostImage(file, 'notice');
      setAttachmentUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
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
        attachmentUrl: attachmentUrl.trim() || undefined,
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
      <p className="text-gray-500 mb-8">제목, 본문, 대표 이미지를 모두 수정할 수 있어요.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">내용 *</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="이벤트 안내를 작성하세요."
            minHeight={320}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">대표 이미지 (선택)</label>
          <div className="flex gap-2">
            <input
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="이미지 URL 직접 입력 또는 우측에서 파일 선택"
              className={`${inputClass} flex-grow`}
            />
            <label className={`flex-shrink-0 px-4 py-2 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition ${uploading ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait' : 'border-purple-300 text-purple-600 hover:bg-purple-50'}`}>
              {uploading ? '업로드 중...' : '📁 파일 선택'}
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          {attachmentUrl && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentUrl}
                alt="미리보기"
                className="h-40 w-auto rounded-lg border border-gray-200 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setAttachmentUrl('')}
            className="text-xs text-red-500 hover:text-red-700 mt-2"
          >
            대표 이미지 제거
          </button>
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
