'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getFileExtension } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CodePreviewProps {
  content: string;
  language?: string;
  filename: string;
}

export function CodePreview({ content, language, filename }: CodePreviewProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lineWrap, setLineWrap] = useState(false);

  const detectedLang = language || SUPPORTED_LANGUAGES[getFileExtension(filename)] || 'plaintext';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/highlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: content, lang: detectedLang }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setHtml(data.html || '');
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback to plain text
          const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const lines = escaped.split('\n');
          const lineNumbers = lines
            .map((_, i) => `<span class="line-number">${i + 1}</span>`)
            .join('\n');
          const codeLines = lines
            .map((l) => `<span class="line">${l}</span>`)
            .join('\n');
          setHtml(
            `<div class="code-container"><div class="line-numbers">${lineNumbers}</div><pre class="code-block"><code>${codeLines}</code></pre></div>`
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content, detectedLang]);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        toast.success('已复制代码');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error('复制失败');
      });
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b949e]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#30363d]/50 bg-[#0d1117] shrink-0">
        <span className="text-xs text-[#8b949e] mr-auto font-mono">{detectedLang}</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setLineWrap(!lineWrap)}
          className={
            lineWrap ? 'bg-[#30363d]/50 text-[#e6edf3]' : 'text-[#8b949e]'
          }
        >
          {lineWrap ? '自动换行' : '不换行'}
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <div
        className={`flex-1 overflow-auto code-preview-scroll ${lineWrap ? 'code-wrap' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
