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
 * 헥스 색상(#RRGGBB)을 어둡게/밝게 조정. factor 1.0 = 원본, 0.7 = 30% 어둡게.
 */
export function adjustHex(hex: string, factor: number): string {
  if (!hex || hex[0] !== '#' || hex.length !== 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0')
  return `#${toHex(r * factor)}${toHex(g * factor)}${toHex(b * factor)}`
}

/**
 * 헥스 색상의 상대 휘도(perceived brightness) — 어두운 배경 위 흰 텍스트 가독성 판단용.
 * 반환값 0(가장 어두움) ~ 1(가장 밝음).
 */
export function hexLuminance(hex: string): number {
  if (!hex || hex[0] !== '#' || hex.length !== 7) return 0.5
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  // 단순 가중 평균 (sRGB 감마는 무시 — 카드 색 선택 UI엔 충분히 정확)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Google Drive 공유 링크처럼 <img>에서 직접 표시되지 않는 URL을 직접 사용 가능한 형태로 변환.
 * 매칭되지 않으면 원본 그대로 반환.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return url;
  // 패턴 1: https://drive.google.com/file/d/{ID}/view?...
  const m1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return `https://lh3.googleusercontent.com/d/${m1[1]}=w1280`;
  // 패턴 2: https://drive.google.com/open?id={ID}
  const m2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return `https://lh3.googleusercontent.com/d/${m2[1]}=w1280`;
  // 패턴 3: https://drive.google.com/uc?id={ID}  (이미 변환된 형태지만 lh3가 더 안정적)
  const m3 = url.match(/drive\.google\.com\/uc\?(?:export=view&)?id=([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return `https://lh3.googleusercontent.com/d/${m3[1]}=w1280`;
  return url;
}

/**
 * YouTube URL → 썸네일 이미지 URL.
 * quality: 'max' (1280×720, 일부 영상은 없음) | 'hq' (480×360, 항상 존재) | 'mq' (320×180)
 */
export function getYouTubeThumbnail(youtubeUrl: string, quality: 'max' | 'hq' | 'mq' = 'hq'): string | null {
  const id = extractYouTubeId(youtubeUrl);
  if (!id) return null;
  const filename = quality === 'max' ? 'maxresdefault' : quality === 'mq' ? 'mqdefault' : 'hqdefault';
  return `https://img.youtube.com/vi/${id}/${filename}.jpg`;
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

/**
 * 텍스트 안의 URL을 감지해 [텍스트, {url}, 텍스트, ...] 형태의 토큰 배열로 반환.
 * 호출하는 쪽에서 React로 렌더링 시 `<a>`로 감싸 클릭 가능하게 만들 수 있다.
 */
export function tokenizeWithUrls(text: string): Array<string | { url: string }> {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s<>"'\)]+[^\s<>"'\.,;:!?\)])/g;
  const out: Array<string | { url: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) out.push(text.slice(lastIndex, match.index));
    out.push({ url: match[1] });
    lastIndex = urlRegex.lastIndex;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}
