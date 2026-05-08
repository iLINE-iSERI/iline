'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { createPost } from '@/lib/firebase/firestore';
import { uploadResourceFile } from '@/lib/firebase/storage';

type Mode = 'file' | 'link';

function NewResourceContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<Mode>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/board/resource');
    }
  }, [authLoading, userProfile, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { url, name } = await uploadResourceFile(file);
      setAttachmentUrl(url);
      setAttachmentName(name);
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

    const trimmedLink = linkUrl.trim();
    if (mode === 'link' && trimmedLink && !/^https?:\/\//i.test(trimmedLink)) {
      alert('링크는 http:// 또는 https:// 로 시작해야 합니다'); return;
    }

    setSaving(true);
    try {
      await createPost({
        type: 'resource',
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        attachmentUrl: mode === 'file' && attachmentUrl ? attachmentUrl : undefined,
        attachmentName: mode === 'file' && attachmentName ? attachmentName : undefined,
        linkUrl: mode === 'link' && trimmedLink ? trimmedLink : undefined,
      });
      router.push('/board/resource');
    } catch {
      alert('저장 실패');
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-32 bg-gray-200 animate-pulse rounded-xl" /></div>;
  }

  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/board/resource')}
        className="text-green-600 hover:text-green-700 font-semibold mb-6"
      >
        ← 자료실 목록
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">자료 등록</h1>
      <p className="text-gray-500 mb-8">학습 자료(PDF, PPT, 이미지 등) 또는 외부 링크를 등록합니다.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 디지털 윤리 워크샵 발표 자료"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">설명 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="자료에 대한 간단한 설명을 적어주세요."
            rows={6}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">첨부 (선택)</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                mode === 'file'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              📎 파일 업로드
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                mode === 'link'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              🔗 외부 링크
            </button>
          </div>

          {mode === 'file' ? (
            <div>
              <label
                className={`flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition ${
                  uploading
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                    : attachmentUrl
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-500 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                {uploading
                  ? '업로드 중...'
                  : attachmentUrl
                    ? `✅ ${attachmentName} (변경하려면 클릭)`
                    : '📁 파일 선택 (클릭 또는 끌어다 놓기)'}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-1">최대 20MB · 모든 파일 형식 (PDF, PPT, HWP, ZIP, 이미지 등)</p>
            </div>
          ) : (
            <div>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1">https://로 시작하는 외부 링크 (구글 드라이브, 유튜브, 노션 등)</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
          <button
            onClick={() => router.push('/board/resource')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            {saving ? '등록 중...' : '자료 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewResourcePage() {
  return (
    <AuthGuard>
      <NewResourceContent />
    </AuthGuard>
  );
}
