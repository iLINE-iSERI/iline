'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getOfflineCourses, createOfflineCourse, updateOfflineCourse, deleteOfflineCourse,
} from '@/lib/firebase/firestore';
import { uploadOfflineCoursePoster } from '@/lib/firebase/storage';
import type { OfflineCourse } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface FormState {
  title: string;
  content: string;
  posterUrl: string;
  instructor: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: string;
  isOpen: boolean;
}

const emptyForm: FormState = {
  title: '', content: '', posterUrl: '', instructor: '',
  startDate: '', endDate: '', location: '', capacity: '0', isOpen: true,
};

function AdminOfflineCoursesContent() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<OfflineCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    getOfflineCourses().then(setCourses).finally(() => setLoading(false));
  }, [authLoading, userProfile, router]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (c: OfflineCourse) => {
    setForm({
      title: c.title,
      content: c.content,
      posterUrl: c.posterUrl ?? '',
      instructor: c.instructor ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      location: c.location,
      capacity: String(c.capacity ?? 0),
      isOpen: c.isOpen,
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert('강좌명을 입력하세요'); return; }
    if (!form.content.trim()) { alert('교육 내용을 입력하세요'); return; }
    if (!form.startDate || !form.endDate) { alert('기간을 입력하세요'); return; }
    if (!form.location.trim()) { alert('장소를 입력하세요'); return; }

    const capacity = parseInt(form.capacity || '0', 10);
    const data = {
      title: form.title.trim(),
      content: form.content.trim(),
      posterUrl: form.posterUrl.trim() || undefined,
      instructor: form.instructor.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location.trim(),
      capacity: isNaN(capacity) ? 0 : capacity,
      isOpen: form.isOpen,
    };

    setSaving(true);
    try {
      if (editId) {
        await updateOfflineCourse(editId, data);
        setCourses(prev => prev.map(c => c.id === editId ? { ...c, ...data } as OfflineCourse : c));
      } else {
        const id = await createOfflineCourse(data);
        const optimistic: OfflineCourse = {
          id, ...data,
          createdAt: { toMillis: () => Date.now(), toDate: () => new Date() } as unknown as OfflineCourse['createdAt'],
          updatedAt: { toMillis: () => Date.now(), toDate: () => new Date() } as unknown as OfflineCourse['updatedAt'],
        };
        setCourses(prev => [optimistic, ...prev]);
      }
      resetForm();
    } catch {
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpen = async (c: OfflineCourse) => {
    try {
      await updateOfflineCourse(c.id, { isOpen: !c.isOpen });
      setCourses(prev => prev.map(x => x.id === c.id ? { ...x, isOpen: !x.isOpen } : x));
    } catch {
      alert('상태 변경 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 강좌를 삭제하시겠습니까? 신청 내역도 영향을 받을 수 있습니다.')) return;
    try {
      await deleteOfflineCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('삭제 실패');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 가능하도록 초기화
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadOfflineCoursePoster(file, editId ?? undefined);
      setForm(prev => ({ ...prev, posterUrl: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">오프라인 강좌 관리</h1>
      <p className="text-gray-500 mb-8">현장 교육 강좌를 개설하고 신청을 관리합니다</p>

      {/* 강좌 목록 */}
      <div className="space-y-3 mb-6">
        {courses.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            아직 오프라인 강좌가 없습니다
          </div>
        )}
        {courses.map(c => (
          <div key={c.id} className={`bg-white rounded-xl border p-5 ${c.isOpen ? 'border-teal-200' : 'border-gray-200 opacity-70'}`}>
            <div className="flex items-start gap-4">
              {c.posterUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.posterUrl} alt={c.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{c.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.isOpen ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isOpen ? '신청 받는 중' : '비공개'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2 whitespace-pre-wrap">{c.content}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>📅 {c.startDate} ~ {c.endDate}</span>
                  <span>📍 {c.location}</span>
                  {c.instructor && <span>👤 {c.instructor}</span>}
                  <span>👥 {c.capacity > 0 ? `정원 ${c.capacity}명` : '정원 무제한'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => router.push(`/admin/offline-courses/${c.id}/applicants`)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition">
                  신청자 관리
                </button>
                <button onClick={() => handleToggleOpen(c)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  {c.isOpen ? '닫기' : '열기'}
                </button>
                <button onClick={() => handleEdit(c)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition">
                  수정
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 추가/수정 폼 */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-purple-400 hover:text-purple-600 rounded-xl text-gray-500 font-medium transition"
        >
          + 새 오프라인 강좌 추가
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? '강좌 수정' : '새 강좌 추가'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">강좌명 *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="예: 디지털 윤리 1기" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">교육 내용 *</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="강의 내용 / 커리큘럼" rows={4} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시작일 *</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">종료일 *</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">장소 *</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="예: 서울시 종로구 OO빌딩 3층 강의실 A" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">강사</label>
              <input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="홍길동" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">정원 (0 = 무제한)</label>
              <input type="number" min="0" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">포스터 이미지</label>
              <div className="flex gap-2">
                <input
                  value={form.posterUrl}
                  onChange={e => setForm({ ...form, posterUrl: e.target.value })}
                  placeholder="이미지 URL 직접 입력 또는 우측에서 파일 선택"
                  className={`${inputClass} flex-grow`}
                />
                <label className={`flex-shrink-0 px-4 py-2 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition ${uploading ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait' : 'border-purple-300 text-purple-600 hover:bg-purple-50'}`}>
                  {uploading ? '업로드 중...' : '📁 파일 선택'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {form.posterUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.posterUrl}
                    alt="미리보기"
                    className="h-24 w-auto rounded-lg border border-gray-200 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">최대 5MB · jpg/png/webp 등 이미지</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
                className={`w-12 h-7 rounded-full transition relative flex-shrink-0 ${form.isOpen ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.isOpen ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-sm text-gray-600">{form.isOpen ? '신청 받는 중 (공개)' : '비공개'}</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-5 rounded-lg transition">
              취소
            </button>
            <button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-gray-300 text-white font-semibold py-2 px-6 rounded-lg transition">
              {saving ? '저장 중...' : (editId ? '수정' : '추가')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOfflineCoursesPage() {
  return (
    <AuthGuard>
      <AdminOfflineCoursesContent />
    </AuthGuard>
  );
}
