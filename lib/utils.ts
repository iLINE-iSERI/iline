import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스명 병합 유틸리티
 * @param inputs 클래스명 배열
 * @returns 병합된 클래스명
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Firestore Timestamp를 포맷된 날짜 문자열로 변환
 * @param timestamp Firestore Timestamp
 * @returns 포맷된 날짜 (예: "2024.01.15")
 */
export function formatDate(timestamp: any): string {
  if (!timestamp) return '';

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * YouTube URL에서 비디오 ID 추출
 * @param url YouTube URL
 * @returns 비디오 ID 또는 null
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // youtu.be 형식
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  // youtube.com/watch?v= 형식
  const longMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (longMatch?.[1]) return longMatch[1];

  // embed 형식
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  return null;
}

/**
 * 초 단위를 시:분:초 형식으로 변환
 * @param seconds 초
 * @returns 포맷된 시간 문자열 (예: "1:23:45")
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
