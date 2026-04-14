'use client';

import { useEffect, useState } from 'react';
import { getPosts } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/lib/types';

function NoticeContent() {
  // 상태 관리
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 공지사항 불러오기
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const noticePosts = await getPosts('notice');
        setPosts(noticePosts);
      } catch (error) {
        console.error('공지사항 로드 실패:', error);
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">공지사항</h1>
        <p className="text-lg text-gray-600">최신 소식과 공지사항을 확인하세요</p>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">공지사항이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border-l-4 border-blue-600"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
              </div>
              <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                더보기 →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoticePage() {
  return (
    <AuthGuard>
      <NoticeContent />
    </AuthGuard>
  );
}
