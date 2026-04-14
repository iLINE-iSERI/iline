'use client';

import { useEffect, useState } from 'react';
import { getPosts } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/lib/types';

function ResourceContent() {
  // 상태 관리
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 자료실 게시글 불러오기
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">자료실</h1>
        <p className="text-lg text-gray-600">학습에 도움이 될 다양한 자료를 다운로드하세요</p>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">다운로드 가능한 자료가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border-l-4 border-green-600"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
              </div>
              <p className="text-gray-700 mb-4">{post.content}</p>

              {/* 다운로드 버튼 */}
              {post.attachmentUrl && (
                <a
                  href={post.attachmentUrl}
                  download
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
                  다운로드
                </a>
              )}
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
