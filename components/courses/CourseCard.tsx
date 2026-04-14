import type { Course } from '@/lib/types';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  // 카테고리 한글 매핑
  const categoryLabel = {
    'ai-basic': 'AI 기초',
    'ai-ethics': 'AI 윤리',
    'coding': '코딩',
  };

  // 카테고리 색상 매핑
  const categoryColor = {
    'ai-basic': 'bg-blue-100 text-blue-800',
    'ai-ethics': 'bg-purple-100 text-purple-800',
    'coding': 'bg-green-100 text-green-800',
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
        {/* 썸네일 */}
        <div className="relative overflow-hidden bg-gray-200 h-40">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover hover:scale-105 transition"
          />
          <span
            className={`absolute top-2 right-2 text-xs font-semibold px-3 py-1 rounded-full ${categoryColor[course.category]}`}
          >
            {categoryLabel[course.category]}
          </span>
        </div>

        {/* 내용 */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 flex-grow mb-4">
            {course.description}
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            자세히 보기 →
          </button>
        </div>
      </div>
    </Link>
  );
}
