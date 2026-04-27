'use client';
import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import CourseCard from '@/components/courses/CourseCard';
import type { Course } from '@/lib/types';

function CoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getCourses();
        setCourses(all.filter((c) => c.isPublished));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const grouped = {
    'ai-basic': courses.filter((c) => c.category === 'ai-basic'),
    'ai-ethics': courses.filter((c) => c.category === 'ai-ethics'),
    'coding': courses.filter((c) => c.category === 'coding'),
  };
  const filtered = cat ? grouped[cat as keyof typeof grouped] : courses;
  const tabs = [
    { key: null, label: '모든 강좌' },
    { key: 'ai-basic', label: 'AI 기초' },
    { key: 'ai-ethics', label: 'AI 윤리' },
    { key: 'coding', label: '코딩' },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-purple-100 rounded-xl w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map((i) => <div key={i} className="h-80 bg-gray-100 rounded-2xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-3">강의 목록</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">강좌 탐색</h1>
        <p className="text-gray-500">다양한 AI 교육 강좌를 둘러보세요</p>
      </div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key || 'all'} onClick={() => setCat(t.key)}
            className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${cat === t.key ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-teal-50 rounded-3xl border border-purple-100">
          <p className="text-gray-500 text-lg">강좌가 없습니다</p>
          <p className="text-gray-400 text-sm mt-1">곧 새로운 강좌가 추가될 예정입니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return <AuthGuard><CoursesContent /></AuthGuard>;
}
