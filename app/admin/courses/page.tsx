'use client';

import { useEffect, useState } from 'react';
import {
  getAllCourses, createCourse, updateCourse, deleteCourse,
  getCategories, createCategory, updateCategory, deleteCategory
} from '@/lib/firebase/firestore';
import type { Course, Category } from '@/lib/types';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'categories'>('courses');
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    category: '',
    isPublished: false,
  });

  // 기본 카테고리 (DB에 없을 때 폴백)
  const defaultCategories = [
    { id: 'ai-basic', name: 'AI 기초', slug: 'ai-basic', order: 0 },
    { id: 'ai-ethics', name: 'AI 윤리', slug: 'ai-ethics', order: 1 },
    { id: 'coding', name: '코딩', slug: 'coding', order: 2 },
  ];

  const activeCats = categories.length > 0 ? categories : defaultCategories;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allCourses, allCats] = await Promise.all([
          getAllCourses(),
          getCategories(),
        ]);
        setCourses(allCourses);
        setCategories(allCats as Category[]);
        if (allCats.length > 0) {
          setFormData(prev => ({ ...prev, category: allCats[0].slug }));
        } else {
          setFormData(prev => ({ ...prev, category: 'ai-basic' }));
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 카테고리 이름 찾기
  const getCatName = (slug: string) => {
    const found = activeCats.find(c => c.slug === slug);
    return found ? found.name : slug;
  };

  // === 강좌 핸들러 ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { alert('강좌명을 입력하세요'); return; }
    try {
      if (editingId) {
        await updateCourse(editingId, formData);
        setCourses(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } : c));
        alert('강좌가 수정되었습니다');
      } else {
        const newId = await createCourse({ ...formData, order: courses.length });
        setCourses(prev => [...prev, { id: newId, ...formData, order: courses.length } as Course]);
        alert('강좌가 생성되었습니다');
      }
      setFormData({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', category: activeCats[0]?.slug || '', isPublished: false });
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
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert('삭제 실패');
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

  const handleCancel = () => {
    setFormData({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', category: activeCats[0]?.slug || '', isPublished: false });
    setEditingId(null);
    setShowForm(false);
  };

  // === 카테고리 핸들러 ===
  const handleAddCat = async () => {
    if (!catName.trim()) { alert('카테고리명을 입력하세요'); return; }
    const slug = catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-');
    try {
      if (editingCatId) {
        await updateCategory(editingCatId, { name: catName, slug });
        setCategories(prev => prev.map(c => c.id === editingCatId ? { ...c, name: catName, slug } : c));
        setEditingCatId(null);
      } else {
        const newId = await createCategory({ name: catName, slug, order: categories.length });
        setCategories(prev => [...prev, { id: newId, name: catName, slug, order: categories.length } as Category]);
      }
      setCatName('');
      setCatSlug('');
    } catch (error) {
      alert('카테고리 저장 실패');
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleEditCat = (cat: Category) => {
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setEditingCatId(cat.id);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 탭 전환 */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'courses'
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          강좌 관리
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'categories'
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          카테고리 관리
        </button>
      </div>

      {/* ===== 카테고리 관리 탭 ===== */}
      {activeTab === 'categories' && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">카테고리 관리</h1>

          {/* 카테고리 추가/수정 폼 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="카테고리 이름 (예: AI 기초)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <input
                type="text"
                value={catSlug}
                onChange={e => setCatSlug(e.target.value)}
                placeholder="슬러그 (예: ai-basic)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button
                onClick={handleAddCat}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition whitespace-nowrap"
              >
                {editingCatId ? '수정' : '추가'}
              </button>
              {editingCatId && (
                <button
                  onClick={() => { setEditingCatId(null); setCatName(''); setCatSlug(''); }}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  취소
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">슬러그는 영문 소문자로 입력하세요. 비워두면 자동 생성됩니다.</p>
          </div>

          {/* 카테고리 목록 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">이름</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">슬러그</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">순서</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {activeCats.map((cat, idx) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEditCat(cat as Category)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">수정</button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="text-red-600 hover:text-red-700 font-semibold text-sm">삭제</button>
                    </td>
                  </tr>
                ))}
                {activeCats.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">카테고리가 없습니다</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 강좌 관리 탭 ===== */}
      {activeTab === 'courses' && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">강좌 관리</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">강좌명 *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                  <input type="url" value={formData.youtubeUrl} onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">썸네일 URL</label>
                  <input type="url" value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                      {activeCats.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">공개 여부</label>
                    <div className="flex items-center gap-2 h-10">
                      <input type="checkbox" id="published" checked={formData.isPublished} onChange={e => setFormData({ ...formData, isPublished: e.target.checked })} className="w-4 h-4" />
                      <label htmlFor="published" className="text-sm font-medium text-gray-700">공개</label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                    {editingId ? '수정하기' : '추가하기'}
                  </button>
                  <button type="button" onClick={handleCancel} className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition">취소</button>
                </div>
              </form>
            </div>
          )}

          {/* 강좌 목록 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">강좌명</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">카테고리</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">상태</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{course.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getCatName(course.category)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {course.isPublished ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(course)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">수정</button>
                      <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-700 font-semibold text-sm">삭제</button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">등록된 강좌가 없습니다</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
