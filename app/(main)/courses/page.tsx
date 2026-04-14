'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import CourseCard from '@/components/courses/CourseCard';
import type { Course } from '@/lib/types';

function CoursesContent() {
  // 상태 관리
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 강좌 불러오기
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = await getCourses();
        setCourses(allCourses.filter((c) => c.isPublished));
      } catch (error) {
        console.error('강좌 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // 카테고리별 그룹핑
  const groupedCourses = {
    'ai-basic': courses.filter((c) => c.category === 'ai-basic'),
    'ai-ethics': courses.filter((c) => c.category === 'ai-ethics'),
    'coding': courses.filter((c) => c.category === 'coding'),
  };

  // 선택된 카테고리의 강좌
  const filteredCourses = selectedCategory
    ? groupedCourses[selectedCategory as keyof typeof groupedCourses]
    : courses;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">강좌 탐색</h1>
        <p className="text-lg text-gray-600">다양한 AI 교육 강좌를 둘러보세요</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          모든 강좌
        </button>
        <button
          onClick={() => setSelectedCategory('ai-basic')}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            selectedCategory === 'ai-basic'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          AI 기초
        </button>
        <button
          onClick={() => setSelectedCategory('ai-ethics')}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            selectedCategory === 'ai-ethics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          AI 윤리
        </button>
        <button
          onClick={() => setSelectedCategory('coding')}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            selectedCategory === 'coding'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          코딩
        </button>
      </div>

      {/* 강좌 그리드 */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">강좌가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <AuthGuard>
      <CoursesContent />
    </AuthGuard>
  );
}
