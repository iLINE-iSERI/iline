'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPosts } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/lib/types';

function NoticeContent() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">공지사항</h1>
          <p className="text-lg text-gray-600">최신 소식과 이벤트를 확인하세요</p>
        </div>
        {isAdmin && (
          <Link
            href="/board/notice/new"
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition"
          >
            + 글쓰기
          </Link>
        )}
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">공지사항이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              href={`/board/notice/${post.id}`}
              key={post.id}
              className="block bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-600"
            >
              <div className="p-6 flex gap-4">
                {post.attachmentUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.attachmentUrl}
                    alt=""
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                    <span className="text-sm text-gray-500 flex-shrink-0">{formatDate(post.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                  <span className="text-blue-600 font-semibold text-sm">자세히 보기 →</span>
                </div>
              </div>
            </Link>
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
