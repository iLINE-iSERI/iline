'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getAllCourses, createCourse, updateCourse, deleteCourse,
  getCategories, createCategory, updateCategory, deleteCategory
} from '@/lib/firebase/firestore';
import type { Course, Category, CategoryColor } from '@/lib/types';

const COLOR_OPTIONS: { value: CategoryColor; label: string; preview: string }[] = [
  { value: 'teal',   label: '청록', preview: 'from-teal-500 to-teal-700' },
  { value: 'blue',   label: '파랑', preview: 'from-blue-500 to-blue-700' },
  { value: 'cyan',   label: '하늘', preview: 'from-cyan-500 to-cyan-700' },
  { value: 'purple', label: '보라', preview: 'from-purple-500 to-purple-700' },
  { value: 'pink',   label: '분홍', preview: 'from-pink-500 to-pink-700' },
  { value: 'orange', label: '주황', preview: 'from-orange-500 to-orange-700' },
  { value: 'green',  label: '초록', preview: 'from-green-500 to-green-700' },
  { value: 'red',    label: '빨강', preview: 'from-red-500 to-red-700' },
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'categories'>('courses');
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catEmoji, setCatEmoji] = useState('');
  const [catEnglishLabel, setCatEnglishLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState<CategoryColor>('teal');
  const [catShowOnHome, setCatShowOnHome] = useState(true);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    category: '',
    isPublished: false,
  });
  const formRef = useRef<HTMLDivElement | null>(null);

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
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('강좌 저장 실패:', error);
      alert(`강좌 저장 실패: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) { alert('삭제 실패: 강좌 ID가 없습니다'); return; }
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('강의 삭제 실패:', error);
      alert(`삭제 실패: ${msg}`);
    }
  };

  const handleEdit = (course: Course) => {
    if (!course.id) { alert('수정 실패: 강좌 ID가 없습니다'); return; }
    setFormData({
      title: course.title || '',
      description: course.description || '',
      youtubeUrl: course.youtubeUrl || '',
      thumbnailUrl: course.thumbnailUrl || '',
      category: course.category || activeCats[0]?.slug || '',
      isPublished: !!course.isPublished,
    });
    setEditingId(course.id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', category: activeCats[0]?.slug || '', isPublished: false });
    setEditingId(null);
    setShowForm(false);
  };

  // === 카테고리 핸들러 ===
  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName(''); setCatSlug(''); setCatEmoji(''); setCatEnglishLabel('');
    setCatDesc(''); setCatColor('teal'); setCatShowOnHome(true);
  };

  const defaultCatExtras: Record<string, { emoji: string; englishLabel: string; description: string; colorTheme: CategoryColor }> = {
    'ai-basic':  { emoji: '🤖', englishLabel: 'AI BASICS', description: '인공지능의 기본 개념과 원리를 배워보세요',  colorTheme: 'teal' },
    'ai-ethics': { emoji: '💡', englishLabel: 'AI ETHICS', description: '인공지능과 윤리적 사고를 함께 키워보세요',    colorTheme: 'blue' },
    'coding':    { emoji: '💻', englishLabel: 'CODING',    description: '프로그래밍의 기초부터 실습까지 도전하세요',    colorTheme: 'cyan' },
  };

  const handleSeedDefaultCats = async () => {
    if (!confirm('기본 카테고리(AI 기초 / AI 윤리 / 코딩)를 DB에 생성하시겠습니까?')) return;
    try {
      const created: Category[] = [];
      for (const dc of defaultCategories) {
        const extras = defaultCatExtras[dc.slug];
        const payload = { name: dc.name, slug: dc.slug, order: dc.order, ...(extras || {}), showOnHome: true };
        const newId = await createCategory(payload);
        created.push({ id: newId, ...payload } as Category);
      }
      setCategories(created);
      alert('기본 카테고리가 생성되었습니다');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`기본 카테고리 생성 실패: ${msg}`);
    }
  };

  const handleAddCat = async () => {
    if (editingCatId && categories.length === 0) {
      alert('아직 DB에 저장된 카테고리가 없습니다. 화면의 항목들은 임시 폴백입니다. 먼저 "기본 카테고리 생성" 버튼을 눌러 DB에 등록하거나, 새 카테고리로 추가하세요.');
      return;
    }
    if (!catName.trim()) { alert('카테고리명을 입력하세요'); return; }
    const slug = catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-');
    const extras = {
      emoji: catEmoji.trim() || undefined,
      englishLabel: catEnglishLabel.trim() || undefined,
      description: catDesc.trim() || undefined,
      colorTheme: catColor,
      showOnHome: catShowOnHome,
    };
    try {
      if (editingCatId) {
        await updateCategory(editingCatId, { name: catName, slug, ...extras });
        setCategories(prev => prev.map(c => c.id === editingCatId ? { ...c, name: catName, slug, ...extras } : c));
      } else {
        const newId = await createCategory({ name: catName, slug, order: categories.length, ...extras });
        setCategories(prev => [...prev, { id: newId, name: catName, slug, order: categories.length, ...extras } as Category]);
      }
      resetCatForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('카테고리 저장 실패:', error);
      alert(`카테고리 저장 실패: ${msg}`);
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (categories.length === 0) { alert('기본 카테고리는 삭제할 수 없습니다. 먼저 새 카테고리를 추가하세요.'); return; }
    if (!id) { alert('삭제 실패: 카테고리 ID가 없습니다'); return; }
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('카테고리 삭제 실패:', error);
      alert(`삭제 실패: ${msg}`);
    }
  };

  const handleEditCat = (cat: Category) => {
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatEmoji(cat.emoji || '');
    setCatEnglishLabel(cat.englishLabel || '');
    setCatDesc(cat.description || '');
    setCatColor((cat.colorTheme as CategoryColor) || 'teal');
    setCatShowOnHome(cat.showOnHome !== false);
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

          {/* 폴백 안내 */}
          {categories.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-amber-900 text-sm">아래 카테고리는 임시 폴백입니다</p>
                <p className="text-amber-700 text-xs mt-1">DB에 카테고리가 하나도 없어서 코드 안의 기본값을 보여드리는 중. 수정/삭제하려면 먼저 DB에 등록해주세요.</p>
              </div>
              <button
                onClick={handleSeedDefaultCats}
                className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg text-sm whitespace-nowrap"
              >
                기본 카테고리 생성
              </button>
            </div>
          )}

          {/* 카테고리 추가/수정 폼 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900">{editingCatId ? '카테고리 수정' : '새 카테고리 추가'}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">이름 *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="예: AI 기초"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">슬러그 (URL용 영문)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={e => setCatSlug(e.target.value)}
                  placeholder="ai-basic (비워두면 자동 생성)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">이모지 (메인 카드 우상단)</label>
                <input
                  type="text"
                  value={catEmoji}
                  onChange={e => setCatEmoji(e.target.value)}
                  placeholder="🤖"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">영문 라벨 (메인 카드 상단 작은 글자)</label>
                <input
                  type="text"
                  value={catEnglishLabel}
                  onChange={e => setCatEnglishLabel(e.target.value)}
                  placeholder="AI BASICS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">설명 (메인 카드 하단 한 줄)</label>
              <input
                type="text"
                value={catDesc}
                onChange={e => setCatDesc(e.target.value)}
                placeholder="인공지능의 기본 개념과 원리를 배워보세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">색상 테마</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCatColor(opt.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition ${
                      catColor === opt.value ? 'border-gray-900' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded bg-gradient-to-br ${opt.preview}`} />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="showOnHome"
                type="checkbox"
                checked={catShowOnHome}
                onChange={e => setCatShowOnHome(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showOnHome" className="text-sm text-gray-700">메인 화면 학습 카테고리에 노출</label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddCat}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {editingCatId ? '수정' : '추가'}
              </button>
              {editingCatId && (
                <button
                  onClick={resetCatForm}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  취소
                </button>
              )}
            </div>
          </div>

          {/* 카테고리 목록 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">메인 카드 미리보기</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">슬러그</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">메인 노출</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {activeCats.map((cat) => {
                  const c = cat as Category;
                  const colorPreview = COLOR_OPTIONS.find(o => o.value === c.colorTheme)?.preview || 'from-gray-400 to-gray-600';
                  return (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br ${colorPreview} text-white text-xs`}>
                          {c.emoji && <span>{c.emoji}</span>}
                          <span className="font-medium">{c.englishLabel || c.slug.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.slug}</td>
                      <td className="px-4 py-3 text-sm">
                        {c.showOnHome === false
                          ? <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">숨김</span>
                          : <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">노출</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditCat(c)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">수정</button>
                          <button onClick={() => handleDeleteCat(c.id)} className="text-red-600 hover:text-red-700 font-semibold text-sm">삭제</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activeCats.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">카테고리가 없습니다</td></tr>
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
            <div ref={formRef} className="bg-white rounded-lg shadow p-8 mb-8 scroll-mt-20">
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
