import type { Course } from '@/lib/types';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const categoryLabel: Record<string, string> = {
    'ai-basic': 'AI 기초',
    'ai-ethics': 'AI 윤리',
    'coding': '코딩',
  };

  const categoryGradient: Record<string, string> = {
    'ai-basic': 'from-purple-500 to-purple-600',
    'ai-ethics': 'from-teal-500 to-teal-600',
    'coding': 'from-blue-500 to-blue-600',
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="card-hover bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative overflow-hidden bg-gray-100 h-44">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span
            className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${categoryGradient[course.category]} text-white shadow-md`}
          >
            {categoryLabel[course.category]}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 flex-grow mb-4 leading-relaxed">
            {course.description}
          </p>
          <span className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold text-sm group">
            자세히 보기
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
