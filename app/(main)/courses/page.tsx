'use client';

import { useEffect, useState } from 'react';
import { getCourses, getCategories } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import CourseCard from '@/components/courses/CourseCard';
import type { Course, Category } from '@/lib/types';

function CoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const defaultCats = [
    { id: '1', name: 'AI 기초', slug: 'ai-basic', order: 0 },
    { id: '2', name: 'AI 윤리', slug: 'ai-ethics', order: 1 },
    { id: '3', name: '코딩', slug: 'coding', order: 2 },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allCourses, allCats] = await Promise.all([
          getCourses(),
          getCategories(),
        ]);
        setCourses(allCourses);
        setCategories(allCats as Category[]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeCats = categories.length > 0 ? categories : defaultCats;
  const filteredCourses = selectedCategory
    ? courses.filter(c => c.category === selectedCategory)
    : courses;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">강좌 탐색</h1>
        <p className="text-lg text-gray-600">다양한 AI 교육 강좌를 둘러보세요</p>
      </div>

      {/* 동적 카테고리 필터 */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          모든 강좌
        </button>
        {activeCats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              selectedCategory === cat.slug
                ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 강좌 그리드 */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">강좌가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
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
