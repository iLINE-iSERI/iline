'use client';

import { useState } from 'react';
import { adjustHex } from '@/lib/utils';

interface Props {
  value: string;             // 현재 선택된 헥스 (예: '#3b82f6')
  onChange: (hex: string) => void;
}

// 테마 색 — 10열(색조) × 5행(명도). 각 컬럼은 Tailwind 팔레트의 200/300/500/700/900 해당.
const THEMED_ROWS: string[][] = [
  // 1행: 가장 밝음
  ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#99f6e4', '#bae6fd', '#bfdbfe', '#c7d2fe', '#e9d5ff', '#fbcfe8'],
  // 2행: 밝음
  ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#5eead4', '#7dd3fc', '#93c5fd', '#a5b4fc', '#d8b4fe', '#f9a8d4'],
  // 3행: 중간 (대표)
  ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'],
  // 4행: 어두움
  ['#b91c1c', '#c2410c', '#a16207', '#15803d', '#0f766e', '#0369a1', '#1d4ed8', '#4338ca', '#7e22ce', '#be185d'],
  // 5행: 가장 어두움
  ['#7f1d1d', '#7c2d12', '#713f12', '#14532d', '#134e4a', '#0c4a6e', '#1e3a8a', '#312e81', '#581c87', '#831843'],
];

// 흑백 + 회색 컬럼 (왼쪽에 별도 표시)
const NEUTRAL_ROWS: string[][] = [
  ['#ffffff', '#e5e7eb'],
  ['#d1d5db', '#9ca3af'],
  ['#6b7280', '#4b5563'],
  ['#374151', '#1f2937'],
  ['#111827', '#000000'],
];

// 표준 색 — 채도 높은 단일 행
const STANDARD_COLORS: string[] = [
  '#7f1d1d', // 짙은 빨강
  '#dc2626', // 빨강
  '#ea580c', // 주황
  '#facc15', // 노랑
  '#84cc16', // 라임
  '#16a34a', // 초록
  '#06b6d4', // 청록
  '#2563eb', // 파랑
  '#1e3a8a', // 남색
  '#7c3aed', // 보라
];

function Swatch({
  color, selected, onClick, size = 'md',
}: { color: string; selected: boolean; onClick: () => void; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <button
      type="button"
      onClick={onClick}
      title={color.toUpperCase()}
      aria-label={`색상 ${color}`}
      className={`${dim} rounded transition border ${
        selected
          ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900'
          : 'border-gray-300 hover:border-gray-500 hover:scale-110'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

export default function CategoryColorPicker({ value, onChange }: Props) {
  const [hexInput, setHexInput] = useState(value || '#3b82f6');

  const normalized = (value || '').toLowerCase();
  const isSelected = (c: string) => c.toLowerCase() === normalized;

  const handleHexInput = (v: string) => {
    setHexInput(v);
    const trimmed = v.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
      onChange(trimmed.toLowerCase());
    }
  };

  // 미리보기용 그라데이션 (선택한 색 → 30% 어둡게)
  const preview = value || '#3b82f6';
  const previewDark = adjustHex(preview, 0.65);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-4">

      {/* 미리보기 */}
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-12 rounded-lg shadow-inner border border-gray-200"
          style={{ background: `linear-gradient(to bottom right, ${preview}, ${previewDark})` }}
        />
        <div className="text-sm">
          <div className="font-mono text-gray-700">{(value || '').toUpperCase()}</div>
          <div className="text-xs text-gray-500">선택된 색상 (어두운 그라데이션 자동 적용)</div>
        </div>
      </div>

      {/* 테마 색 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2">테마 색</h4>
        <div className="flex gap-2">
          {/* 흑백 컬럼 */}
          <div className="flex flex-col gap-1">
            {NEUTRAL_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-1">
                {row.map((c) => (
                  <Swatch key={c} color={c} selected={isSelected(c)} onClick={() => onChange(c)} />
                ))}
              </div>
            ))}
          </div>
          {/* 구분선 */}
          <div className="w-px bg-gray-200" />
          {/* 컬러 컬럼들 */}
          <div className="flex flex-col gap-1">
            {THEMED_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-1">
                {row.map((c) => (
                  <Swatch key={c} color={c} selected={isSelected(c)} onClick={() => onChange(c)} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 표준 색 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2">표준 색</h4>
        <div className="flex gap-1">
          {STANDARD_COLORS.map((c) => (
            <Swatch key={c} color={c} selected={isSelected(c)} onClick={() => onChange(c)} />
          ))}
        </div>
      </div>

      {/* 사용자 지정 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2">사용자 지정 색상</h4>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput : '#3b82f6'}
            onChange={(e) => {
              setHexInput(e.target.value);
              onChange(e.target.value.toLowerCase());
            }}
            className="w-10 h-9 rounded border border-gray-300 cursor-pointer bg-white"
            title="컬러 휠로 직접 선택"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#3b82f6"
            maxLength={7}
            className="w-28 px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <span className="text-xs text-gray-400">HEX 직접 입력</span>
        </div>
      </div>
    </div>
  );
}
