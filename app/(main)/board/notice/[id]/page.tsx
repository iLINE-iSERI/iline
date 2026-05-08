'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPost, deletePost } from '@/lib/firebase/firestore';
import { formatDate, tokenizeWithUrls } from '@/lib/utils';
import type { Post } from '@/lib/types';

interface Props { params: { id: string } }

function NoticeDetailContent({ id }: { id: string }) {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomed(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  useEffect(() => {
    if (!id) return;
    getPost(id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm('이 공지를 삭제하시겠습니까?')) return;
    try {
      await deletePost(post.id);
      router.push('/board/notice');
    } catch {
      alert('삭제 실패');
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 animate-pulse rounded-xl" /></div>;
  }

  if (!post || post.type !== 'notice') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">공지를 찾을 수 없습니다</p>
        <button onClick={() => router.push('/board/notice')} className="text-blue-600 hover:text-blue-700 font-semibold">
          공지사항 목록으로
        </button>
      </div>
    );
  }

  const tokens = tokenizeWithUrls(post.content);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/board/notice')} className="text-blue-600 hover:text-blue-700 font-semibold">
          ← 공지사항 목록
        </button>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
          >
            삭제
          </button>
        )}
      </div>

      <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {post.attachmentUrl && (
          <div className="bg-gray-50 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.attachmentUrl}
              alt={post.title}
              className="w-full max-h-96 object-contain mx-auto cursor-zoom-in transition hover:opacity-90"
              onClick={() => setZoomed(true)}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-center text-xs text-gray-400 pb-2">이미지를 클릭하면 크게 볼 수 있어요</p>
          </div>
        )}
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{formatDate(post.createdAt)}</p>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            {tokens.map((t, i) =>
              typeof t === 'string'
                ? <span key={i}>{t}</span>
                : (
                  <a
                    key={i}
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    {t.url}
                  </a>
                )
            )}
          </div>
        </div>
      </article>

      {zoomed && post.attachmentUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 확대 보기"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition"
            aria-label="닫기"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.attachmentUrl}
            alt={post.title}
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default function NoticeDetailPage({ params }: Props) {
  return (
    <AuthGuard>
      <NoticeDetailContent id={params.id} />
    </AuthGuard>
  );
}
