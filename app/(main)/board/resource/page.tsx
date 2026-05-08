'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPosts, deletePost } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/lib/types';

function ResourceContent() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const resourcePosts = await getPosts('resource');
        setPosts(resourcePosts);
      } catch (error) {
        console.error('자료실 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const handleDelete = async (post: Post) => {
    if (!confirm(`"${post.title}" 자료를 삭제할까요?`)) return;
    try {
      await deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      alert('삭제 실패');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">자료실</h1>
          <p className="text-lg text-gray-600">학습에 도움이 될 다양한 자료를 다운로드하세요</p>
        </div>
        {isAdmin && (
          <Link
            href="/board/resource/new"
            className="flex-shrink-0 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition"
          >
            + 자료 등록
          </Link>
        )}
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">등록된 자료가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border-l-4 border-green-600"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(post)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2 py-1 rounded transition"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap break-words">{post.content}</p>

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-2">
                {post.attachmentUrl && (
                  <a
                    href={post.attachmentUrl}
                    download={post.attachmentName || true}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {post.attachmentName ? `다운로드 (${post.attachmentName})` : '다운로드'}
                  </a>
                )}
                {post.linkUrl && (
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    링크 열기
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourcePage() {
  return (
    <AuthGuard>
      <ResourceContent />
    </AuthGuard>
  );
}
