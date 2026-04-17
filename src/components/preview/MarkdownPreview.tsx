'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        toast.success('已复制');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error('复制失败');
      });
  };

  const renderedContent = useMemo(
    () => (
      <div className="markdown-body p-4 overflow-auto flex-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    ),
    [content]
  );

  const sourceContent = useMemo(
    () => (
      <pre className="p-4 overflow-auto flex-1 text-sm font-mono text-[#e6edf3] whitespace-pre-wrap break-words bg-transparent">
        {content}
      </pre>
    ),
    [content]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#30363d]/50 bg-[#0d1117] shrink-0">
        <span className="text-xs text-[#8b949e] mr-auto">Markdown</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setViewMode('rendered')}
          className={viewMode === 'rendered' ? 'bg-[#30363d]/50 text-[#e6edf3]' : 'text-[#8b949e]'}
        >
          <Eye className="h-3 w-3 mr-1" />
          预览
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setViewMode('source')}
          className={viewMode === 'source' ? 'bg-[#30363d]/50 text-[#e6edf3]' : 'text-[#8b949e]'}
        >
          <Code className="h-3 w-3 mr-1" />
          源码
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'rendered' ? renderedContent : sourceContent}
      </div>
    </div>
  );
}
