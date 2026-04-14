'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserProfile } from '@/lib/types';

export default function AdminUsersPage() {
  // 상태 관리
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // 사용자 목록 불러오기
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        })) as UserProfile[];
        setUsers(userList);
      } catch (error) {
        console.error('사용자 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // 역할 변경
  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
      });

      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole as any } : u))
      );
      alert('역할이 변경되었습니다');
    } catch (error) {
      console.error('역할 변경 실패:', error);
      alert('역할 변경에 실패했습니다');
    }
  };

  // 역할 한글 매핑
  const roleLabel = {
    'student': '학생',
    'teacher': '강사',
    'admin': '관리자',
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-lg text-gray-600 mt-2">
          총 {users.length}명의 사용자
        </p>
      </div>

      {/* 사용자 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                이름
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                역할
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{user.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {roleLabel[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="student">학생</option>
                    <option value="teacher">강사</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">사용자가 없습니다</p>
        </div>
      )}
    </div>
  );
}
