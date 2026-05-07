'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { createPost } from '@/lib/firebase/firestore';
import { uploadPostImage } from '@/lib/firebase/storage';

function NewNoticeContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/board/notice');
    }
  }, [authLoading, userProfile, router]);

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
    if (!user?.uid) return;
    if (!title.trim()) { alert('제목을 입력하세요'); return; }
    if (!content.trim()) { alert('내용을 입력하세요'); return; }
    setSaving(true);
    try {
      await createPost({
        type: 'notice',
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      router.push('/board/notice');
    } catch {
      alert('저장 실패');
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-32 bg-gray-200 animate-pulse rounded-xl" /></div>;
  }

  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/board/notice')}
        className="text-blue-600 hover:text-blue-700 font-semibold mb-6"
      >
        ← 공지사항 목록
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항 작성</h1>
      <p className="text-gray-500 mb-8">이벤트 안내 등 공지를 작성합니다. 본문에 적은 URL은 자동으로 클릭 가능한 링크가 됩니다.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 2026년 5월 디지털 윤리 워크샵 안내"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`이벤트 안내를 작성하세요.\n\n링크를 적으면 자동으로 클릭 가능해져요. 예: https://iline-five.vercel.app/offline-courses`}
            rows={12}
            className={`${inputClass} resize-y`}
          />
          <p className="text-xs text-gray-400 mt-1">줄바꿈 그대로 표시됩니다. URL은 본문에 그냥 붙여넣어도 자동 링크 처리됩니다.</p>
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
          <p className="text-xs text-gray-400 mt-1">최대 5MB · jpg/png/webp 등 이미지</p>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
          <button
            onClick={() => router.push('/board/notice')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            {saving ? '게시 중...' : '공지 게시'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewNoticePage() {
  return (
    <AuthGuard>
      <NewNoticeContent />
    </AuthGuard>
  );
}
