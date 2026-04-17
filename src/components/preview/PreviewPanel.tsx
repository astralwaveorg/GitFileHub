'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X,
  Copy,
  Download,
  Pencil,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CodePreview } from './CodePreview';
import { MarkdownPreview } from './MarkdownPreview';
import { ImagePreview } from './ImagePreview';
import { CodeEditor } from '@/components/editor/CodeEditor';
import {
  SUPPORTED_LANGUAGES,
  getFileExtension,
  isImageFile,
  isPdfFile,
  formatFileSize,
} from '@/lib/constants';

export interface PreviewFileInfo {
  name: string;
  path: string;
  size: number;
  isText: boolean;
  extension: string;
  content?: string;
}

interface PreviewPanelProps {
  file: PreviewFileInfo;
  repo: string;
  onClose: () => void;
  onEdit?: (file: PreviewFileInfo) => void;
  onSave?: (path: string, content: string) => Promise<void>;
}

export function PreviewPanel({ file, repo, onClose, onEdit, onSave }: PreviewPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detect file type
  const isImage = isImageFile(file.name);
  const isPdf = isPdfFile(file.name);
  const isMarkdown = file.extension === 'md' || file.extension === 'markdown';
  const canEdit = file.isText && !isImage && !isPdf;

  // Fetch file content
  useEffect(() => {
    if (isImage) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/files/${repo}/${encodeURIComponent(file.path)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.success && data.file) {
            setContent(data.file.content || '');
          } else {
            setError(data.error || '加载文件失败');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('网络错误，请重试');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file.path, repo, isImage]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = useCallback(
    async (newContent: string) => {
      if (!onSave) return;
      setSaving(true);
      try {
        await onSave(file.path, newContent);
        setContent(newContent);
        setEditing(false);
        toast.success('保存成功');
      } catch {
        toast.error('保存失败');
      } finally {
        setSaving(false);
      }
    },
    [onSave, file.path]
  );

  const rawUrl = `/raw/${repo}/${file.path}`;
  const downloadUrl = `/api/files/${repo}/download/${file.path}`;
  const detectedLang = SUPPORTED_LANGUAGES[file.extension] || 'plaintext';

  const handleCopyLink = () => {
    const url = window.location.origin + rawUrl;
    navigator.clipboard.writeText(url).then(
      () => toast.success('链接已复制'),
      () => toast.error('复制失败')
    );
  };

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] gap-3 p-4">
          <AlertCircle className="h-8 w-8 text-[#f85149]" />
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    // Editing mode
    if (editing && content !== null) {
      return (
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            content={content}
            language={detectedLang}
            onSave={handleSave}
            saving={saving}
          />
        </div>
      );
    }

    // Image preview
    if (isImage) {
      return (
        <ImagePreview
          src={rawUrl}
          filename={file.name}
          size={file.size}
        />
      );
    }

    // PDF preview
    if (isPdf) {
      return (
        <iframe
          src={rawUrl}
          className="w-full h-full border-0"
          title={file.name}
        />
      );
    }

    // Text files
    if (content !== null) {
      // Markdown
      if (isMarkdown) {
        return <MarkdownPreview content={content} />;
      }

      // Code / text
      return (
        <CodePreview
          content={content}
          language={detectedLang}
          filename={file.name}
        />
      );
    }

    // Binary file fallback
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] gap-3 p-4">
        <FileText className="h-8 w-8" />
        <p className="text-sm">此文件类型不支持预览</p>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5 mr-1" />
          下载文件
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:w-[60%] lg:w-[55%] xl:w-[50%] h-full bg-[#0d1117] border-l border-[#30363d] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-[#e6edf3] truncate">
              {file.name}
            </h2>
            <p className="text-xs text-[#8b949e]">
              {formatFileSize(file.size)}
              {file.extension && ` · ${file.extension.toUpperCase()}`}
            </p>
          </div>

          {/* Edit button */}
          {canEdit && !editing && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#8b949e] hover:text-[#e6edf3]"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              编辑
            </Button>
          )}

          {editing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#8b949e] hover:text-[#e6edf3]"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              取消编辑
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#e6edf3]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        {!editing && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-[#30363d] bg-[#161b22]/50 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#8b949e] hover:text-[#e6edf3]"
              onClick={handleCopyLink}
            >
              <Copy className="h-3.5 w-3.5" />
              复制链接
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#8b949e] hover:text-[#e6edf3]"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
