'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface Props {
  html: string;
  className?: string;
}

/**
 * 사용자가 작성한 리치 텍스트(HTML)를 XSS 방어 후 렌더링.
 * 평문 콘텐츠도 안전하게 처리(HTML 태그 없으면 줄바꿈 유지).
 */
export default function RichTextDisplay({ html, className }: Props) {
  const sanitized = useMemo(() => {
    if (!html) return '';
    // HTML 태그가 전혀 없으면 평문으로 간주, <br>로 줄바꿈 보존
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(html);
    if (!looksLikeHtml) {
      const escaped = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />');
      return `<p>${escaped}</p>`;
    }
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'hr', 'strong', 'em', 'u', 's', 'code',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre',
        'a', 'span', 'div',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'colspan', 'rowspan', 'style', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|#):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  }, [html]);

  return (
    <div
      className={className || 'prose prose-sm sm:prose-base max-w-none'}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * HTML에서 텍스트만 추출 (목록 미리보기용).
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    // SSR 안전 폴백: 태그 제거
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}
