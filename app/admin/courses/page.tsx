'use client';

import { useEffect, useState } from 'react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/firebase/firestore';
import type { Course } from '@/lib/types';

export default function AdminCoursesPage() {
  // 상태 관리
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    category: 'ai-basic' as const,
    isPublished: false,
  });

  // 강좌 목록 불러오기
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = await getCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error('강좌 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('강좌명을 입력하세요');
      return;
    }

    try {
      if (editingId) {
        // 수정
        await updateCourse(editingId, formData);
        setCourses((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...formData } : c))
        );
        alert('강좌가 수정되었습니다');
      } else {
        // 생성
        const newCourse = await createCourse({
          title: formData.title,
          description: formData.description,
          youtubeUrl: formData.youtubeUrl,
          thumbnailUrl: formData.thumbnailUrl,
          category: 'ai-basic',
          isPublished: true,
          order: 0,           
        });
        setCourses((prev) => [...prev, { id: newCourse, ...formData, category: 'ai-basic' as const, isPublished: true, order: 0 } as Course]);
        alert('강좌가 생성되었습니다');
      }

      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        youtubeUrl: '',
        thumbnailUrl: '',
        category: 'ai-basic',
        isPublished: false,
      });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('강좌 저장 실패:', error);
      alert('강좌 저장에 실패했습니다');
    }
  };

  // 강좌 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      alert('강좌가 삭제되었습니다');
    } catch (error) {
      console.error('강좌 삭제 실패:', error);
      alert('강좌 삭제에 실패했습니다');
    }
  };

  // 강좌 편집
  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description,
      youtubeUrl: course.youtubeUrl,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      isPublished: course.isPublished,
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  // 폼 취소
  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      thumbnailUrl: '',
      category: 'ai-basic',
      isPublished: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">강좌 관리</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          + 새 강좌 추가
        </button>
      </div>

      {/* 강좌 추가/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingId ? '강좌 수정' : '새 강좌 추가'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강좌명 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                썸네일 URL
              </label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ai-basic">AI 기초</option>
                  <option value="ai-ethics">AI 윤리</option>
                  <option value="coding">코딩</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공개 여부
                </label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-gray-700">
                    공개
                  </label>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {editingId ? '수정하기' : '추가하기'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 강좌 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                강좌명
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{course.title}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {course.category === 'ai-basic'
                      ? 'AI 기초'
                      : course.category === 'ai-ethics'
                        ? 'AI 윤리'
                        : '코딩'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      course.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {course.isPublished ? '공개' : '비공개'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
