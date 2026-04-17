'use client';

import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection, rectangularSelection, highlightActiveLine } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { defaultKeymap, indentWithTab, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { sql } from '@codemirror/lang-sql';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Undo2, Redo2 } from 'lucide-react';

const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
  yaml: () => yaml(),
  java: () => java(),
  c: () => cpp(),
  cpp: () => cpp(),
  rust: () => rust(),
  go: () => go(),
  sql: () => sql(),
  shell: () => [],
  plaintext: () => [],
};

interface CodeEditorProps {
  content: string;
  language: string;
  onSave: (content: string) => void;
  saving?: boolean;
}

export function CodeEditor({ content, language, onSave, saving }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lineCountRef = useRef<HTMLSpanElement>(null);

  const getExtensions = useCallback((): Extension[] => {
    const langExt = LANGUAGE_EXTENSIONS[language] || LANGUAGE_EXTENSIONS.plaintext;
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      langExt(),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && lineCountRef.current) {
          lineCountRef.current.textContent = `${update.state.doc.lines} 行`;
        }
      }),
      EditorView.theme({
        '&': { fontSize: '13px' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ];
  }, [language]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create editor once on mount
    const state = EditorState.create({
      doc: content,
      extensions: getExtensions(),
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Set initial line count
    if (lineCountRef.current) {
      lineCountRef.current.textContent = `${content.split('\n').length} 行`;
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update content externally when it changes (e.g. after save)
  useEffect(() => {
    if (!viewRef.current) return;
    const currentContent = viewRef.current.state.doc.toString();
    if (content !== currentContent) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      });
    }
  }, [content]);

  const handleSave = useCallback(() => {
    if (!viewRef.current || saving) return;
    const content = viewRef.current.state.doc.toString();
    onSave(content);
  }, [onSave, saving]);

  const handleUndo = useCallback(() => {
    if (!viewRef.current) return;
    undo(viewRef.current);
  }, []);

  const handleRedo = useCallback(() => {
    if (!viewRef.current) return;
    redo(viewRef.current);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleUndo}
          className="text-[#8b949e] hover:text-[#e6edf3] h-7 w-7"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRedo}
          className="text-[#8b949e] hover:text-[#e6edf3] h-7 w-7"
          title="重做 (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <span ref={lineCountRef} className="text-xs text-[#8b949e] mr-2" />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white h-7 px-3"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          保存
        </Button>
      </div>

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-hidden [&_.cm-editor]:h-full" />
    </div>
  );
}
