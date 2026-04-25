'use client';

import { useEffect, useState } from 'react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/firebase/firestore';
import type { Course } from '@/lib/types';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    youtubeUrl: string;
    thumbnailUrl: string;
    category: 'ai-basic' | 'ai-ethics' | 'coding';
    isPublished: boolean;
  }>({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    category: 'ai-basic',
    isPublished: false,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { alert('강좌명을 입력하세요'); return; }
    try {
      if (editingId) {
        await updateCourse(editingId, formData);
        setCourses((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...formData } : c)));
        alert('강좌가 수정되었습니다');
      } else {
        const newId = await createCourse({ ...formData, order: 0 });
        setCourses((prev) => [...prev, { id: newId, ...formData, order: 0 } as Course]);
        alert('강좌가 생성되었습니다');
      }
      setFormData({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', category: 'ai-basic', isPublished: false });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('강좌 저장 실패:', error);
      alert('강좌 저장에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('강좌 삭제 실패:', error);
    }
  };

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

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><p>로딩 중...</p></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">강좌 관리</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ 새 강좌</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 space-y-4">
          <h2 className="text-xl font-bold">{editingId ? '강좌 수정' : '새 강좌 추가'}</h2>
          <input type="text" placeholder="강좌명" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
          <textarea placeholder="설명" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} />
          <input type="url" placeholder="YouTube URL" value={formData.youtubeUrl} onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input type="url" placeholder="썸네일 URL" value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as 'ai-basic' | 'ai-ethics' | 'coding' })} className="w-full px-4 py-2 border rounded-lg">
            <option value="ai-basic">AI 기초</option>
            <option value="ai-ethics">AI 윤리</option>
            <option value="coding">코딩</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} /> 공개</label>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">{editingId ? '수정' : '추가'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-gray-400 text-white px-6 py-2 rounded-lg">취소</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100"><tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">강좌명</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">카테고리</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">상태</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">작업</th>
          </tr></thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{course.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{course.category === 'ai-basic' ? 'AI 기초' : course.category === 'ai-ethics' ? 'AI 윤리' : '코딩'}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{course.isPublished ? '공개' : '비공개'}</span></td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => handleEdit(course)} className="text-blue-600 text-sm">수정</button>
                  <button onClick={() => handleDelete(course.id)} className="text-red-600 text-sm">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
