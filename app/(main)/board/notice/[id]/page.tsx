'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { getPost, deletePost } from '@/lib/firebase/firestore';
import { formatDate } from '@/lib/utils';
import RichTextDisplay from '@/components/editor/RichTextDisplay';
import type { Post } from '@/lib/types';

interface Props { params: { id: string } }

function NoticeDetailContent({ id }: { id: string }) {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomIdx, setZoomIdx] = useState<number | null>(null); // null = 닫힘, 숫자 = 그 인덱스 표시
  const isAdmin = userProfile?.role === 'admin';

  // 옛 단일 필드 + 새 배열 머지 (중복 제거)
  const images = useMemo<string[]>(() => {
    if (!post) return [];
    const arr = [
      ...(post.attachmentUrls || []),
      ...(post.attachmentUrl ? [post.attachmentUrl] : []),
    ].filter(Boolean) as string[];
    return Array.from(new Set(arr));
  }, [post]);

  useEffect(() => {
    if (zoomIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomIdx(null);
      if (e.key === 'ArrowRight') setZoomIdx(idx => idx === null ? idx : Math.min(images.length - 1, idx + 1));
      if (e.key === 'ArrowLeft') setZoomIdx(idx => idx === null ? idx : Math.max(0, idx - 1));
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomIdx, images.length]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/board/notice')} className="text-blue-600 hover:text-blue-700 font-semibold">
          ← 공지사항 목록
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href={`/board/notice/${post.id}/edit`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 첨부 이미지 — 1개면 단일 큰 이미지, 여러 개면 첫 번째 강조 + 썸네일 strip */}
        {images.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={post.title}
              className="w-full max-h-96 object-contain mx-auto cursor-zoom-in transition hover:opacity-90"
              onClick={() => setZoomIdx(0)}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {images.length > 1 && (
              <div className="px-3 py-2 flex gap-2 overflow-x-auto">
                {images.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    onClick={() => setZoomIdx(idx)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition relative"
                    title={`이미지 ${idx + 1} / ${images.length}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`첨부 ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] font-semibold px-1 rounded">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-center text-xs text-gray-400 pb-2">
              이미지를 클릭하면 크게 볼 수 있어요{images.length > 1 ? ' (← → 키로 이동)' : ''}
            </p>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
          <p className="text-sm text-gray-500 mb-6">
            {formatDate(post.createdAt)}
            {post.updatedAt && post.createdAt && post.updatedAt.toMillis?.() !== post.createdAt.toMillis?.() && (
              <span className="ml-2 text-xs text-gray-400">(수정 {formatDate(post.updatedAt)})</span>
            )}
          </p>
          <RichTextDisplay
            html={post.content}
            className="prose prose-sm sm:prose-base max-w-none break-words [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_a]:text-blue-600 [&_a]:underline"
          />
        </div>
      </article>

      {/* 라이트박스 */}
      {zoomIdx !== null && images[zoomIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomIdx(null)}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 확대 보기"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomIdx(null); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition"
            aria-label="닫기"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomIdx(Math.max(0, zoomIdx - 1)); }}
                disabled={zoomIdx === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-2xl flex items-center justify-center transition"
                aria-label="이전 이미지"
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomIdx(Math.min(images.length - 1, zoomIdx + 1)); }}
                disabled={zoomIdx === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-2xl flex items-center justify-center transition"
                aria-label="다음 이미지"
              >
                →
              </button>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm font-medium px-3 py-1 rounded-full">
                {zoomIdx + 1} / {images.length}
              </div>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[zoomIdx]}
            alt={`${post.title} ${zoomIdx + 1}`}
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
