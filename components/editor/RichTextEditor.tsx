'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { useCallback } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const FONT_CHOICES = [
  { label: '기본', value: '' },
  { label: '본명조', value: 'Noto Serif KR, serif' },
  { label: '본고딕', value: 'Noto Sans KR, sans-serif' },
  { label: '나눔고딕', value: 'Nanum Gothic, sans-serif' },
  { label: '나눔손글씨', value: 'Nanum Pen Script, cursive' },
  { label: 'Mono', value: 'ui-monospace, Menlo, monospace' },
];

const HEADING_CHOICES = [
  { label: '본문', value: 'p' },
  { label: '제목 1', value: 'h1' },
  { label: '제목 2', value: 'h2' },
  { label: '제목 3', value: 'h3' },
];

const COLOR_CHOICES = [
  '#1f2937', // 기본 진회색
  '#ef4444', // 빨강
  '#f97316', // 주황
  '#eab308', // 노랑
  '#22c55e', // 초록
  '#0ea5e9', // 파랑
  '#8b5cf6', // 보라
  '#ec4899', // 분홍
];

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition ${
        active
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const setHeading = useCallback((value: string) => {
    if (!editor) return;
    if (value === 'p') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: parseInt(value.slice(1)) as 1 | 2 | 3 }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 URL을 입력하세요 (http:// 또는 https://)', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const currentHeading = editor.isActive('heading', { level: 1 }) ? 'h1'
    : editor.isActive('heading', { level: 2 }) ? 'h2'
    : editor.isActive('heading', { level: 3 }) ? 'h3'
    : 'p';

  const currentFont = (editor.getAttributes('textStyle').fontFamily as string | undefined) || '';
  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) || '';

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      {/* 헤딩 */}
      <select
        value={currentHeading}
        onChange={(e) => setHeading(e.target.value)}
        className="px-2 py-1 rounded text-sm border border-gray-200 bg-white"
        title="문단 스타일"
      >
        {HEADING_CHOICES.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
      </select>

      {/* 폰트 */}
      <select
        value={currentFont}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        className="px-2 py-1 rounded text-sm border border-gray-200 bg-white"
        title="글꼴"
      >
        {FONT_CHOICES.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
      </select>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게 (Ctrl+B)"><b>B</b></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임 (Ctrl+I)"><i>I</i></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄 (Ctrl+U)"><u>U</u></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><s>S</s></ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* 색상 팔레트 */}
      <div className="flex items-center gap-0.5">
        {COLOR_CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => editor.chain().focus().setColor(c).run()}
            title={`색상 ${c}`}
            className={`w-5 h-5 rounded-full border-2 ${currentColor === c ? 'border-purple-500' : 'border-white'} shadow-sm`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          title="색상 제거"
          className="w-5 h-5 rounded-full border border-gray-300 bg-white text-xs text-gray-400 flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">⬅</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">⬌</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">➡</ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호 목록">• 목록</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 매기기 목록">1. 목록</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">❝</ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="링크 삽입/제거">🔗</ToolbarButton>

      {/* 표 */}
      <div className="relative group">
        <ToolbarButton onClick={insertTable} title="3x3 표 삽입">📊 표</ToolbarButton>
        {editor.isActive('table') && (
          <div className="flex items-center gap-1 ml-1">
            <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="열 추가">+열</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="행 추가">+행</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">-열</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="행 삭제">-행</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="표 삭제">🗑</ToolbarButton>
          </div>
        )}
      </div>

      <div className="flex-grow" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="실행 취소 (Ctrl+Z)">↶</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시 실행 (Ctrl+Y)">↷</ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="서식 모두 지우기"
      >
        🧹
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 240 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank', class: 'text-purple-600 underline' } }),
      Placeholder.configure({ placeholder: placeholder || '내용을 입력하세요...' }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse w-full my-3' } }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: 'border border-gray-300 bg-gray-100 p-2 font-semibold' } }),
      TableCell.configure({ HTMLAttributes: { class: 'border border-gray-300 p-2' } }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <Toolbar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
