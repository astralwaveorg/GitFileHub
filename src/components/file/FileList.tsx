'use client';

import { FileIcon } from './FileIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Download,
  Eye,
  Pencil,
  Trash2,
  PenLine,
  FolderPlus,
  ExternalLink,
  FolderInput,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatFileSize, formatRelativeTime } from '@/lib/constants';
import { toast } from 'sonner';

export interface FileItemData {
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  path: string;
  childCount?: number;
}

export type FileAction = 'preview' | 'edit' | 'download' | 'delete' | 'rename' | 'copyLink' | 'copyDirLink';

interface FileListProps {
  files: FileItemData[];
  loading?: boolean;
  onFileAction?: (file: FileItemData, action: FileAction) => void;
  onFileClick?: (file: FileItemData) => void;
  onDelete?: (file: FileItemData) => void;
  onRename?: (file: FileItemData) => void;
  repoId?: string;
  currentPath?: string;
  isAuthenticated?: boolean;
}

export function FileList({
  files,
  loading,
  onFileAction,
  onFileClick,
  onDelete,
  onRename,
  repoId = '',
  currentPath = '',
  isAuthenticated = false,
}: FileListProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-20 rounded ml-auto" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderPlus className="h-12 w-12 text-[#8b949e]/30 mb-4" />
        <p className="text-[#8b949e]">此目录为空</p>
        <p className="text-xs text-[#8b949e]/60 mt-1">
          上传文件或创建新文件夹
        </p>
      </div>
    );
  }

  const handleClick = (file: FileItemData) => {
    if (onFileAction) {
      onFileAction(file, 'preview');
    } else if (onFileClick) {
      onFileClick(file);
    }
  };

  const handleAction = (file: FileItemData, action: FileAction) => {
    if (onFileAction) {
      onFileAction(file, action);
      return;
    }
    // Fallback for old interface
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const rawUrl = `/raw/${repoId}/${filePath}`;
    const downloadUrl = `/api/files/${repoId}/download/${filePath}`;

    switch (action) {
      case 'preview':
        if (onFileClick) onFileClick(file);
        break;
      case 'download':
        window.open(downloadUrl, '_blank');
        break;
      case 'copyLink':
        navigator.clipboard.writeText(rawUrl).then(
          () => toast.success('链接已复制'),
          () => toast.error('复制失败')
        );
        break;
      case 'copyDirLink':
        navigator.clipboard.writeText(`${window.location.origin}/browse/${repoId}/${filePath}`).then(
          () => toast.success('目录链接已复制'),
          () => toast.error('复制失败')
        );
        break;
      case 'delete':
        onDelete?.(file);
        break;
      case 'rename':
        onRename?.(file);
        break;
    }
  };

  return (
    <div className="divide-y divide-[#30363d]/50">
      {files.map((file) => (
        <FileRow
          key={file.path}
          file={file}
          onClick={() => handleClick(file)}
          onAction={(action) => handleAction(file, action)}
          isAuthenticated={isAuthenticated}
          repoName={repoId}
        />
      ))}
    </div>
  );
}

interface FileRowProps {
  file: FileItemData;
  onClick: () => void;
  onAction: (action: FileAction) => void;
  isAuthenticated: boolean;
  repoName: string;
}

function FileRow({ file, onClick, onAction, isAuthenticated, repoName }: FileRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const filePath = file.path;
    const url = `${window.location.origin}/raw/${repoName}/${filePath}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyDirLink = () => {
    const url = `${window.location.origin}/browse/${repoName}/${file.path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('目录链接已复制');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="group flex items-center gap-4 px-4 py-2.5 hover:bg-[#161b22]/60 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Icon */}
      <div className="shrink-0">
        <FileIcon filename={file.name} isDirectory={file.isDirectory} className="h-4 w-4" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block text-[#e6edf3]">
          {file.name}
        </span>
      </div>

      {/* Size / Child count */}
      <div className="hidden sm:block w-24 text-right">
        {file.isDirectory ? (
          <span className="text-xs text-[#8b949e]">
            {file.childCount !== undefined ? `${file.childCount} 个文件` : '—'}
          </span>
        ) : (
          <span className="text-xs text-[#8b949e]">
            {formatFileSize(file.size)}
          </span>
        )}
      </div>

      {/* Modified */}
      <div className="hidden md:block w-28 text-right">
        <span className="text-xs text-[#8b949e]">
          {formatRelativeTime(file.modifiedAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!file.isDirectory && (
              <>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onAction('preview'); }}
                >
                  <Eye className="h-4 w-4" />
                  预览
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onAction('edit'); }}
                >
                  <Pencil className="h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onAction('download'); }}
                >
                  <Download className="h-4 w-4" />
                  下载
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  {copied ? '已复制' : '复制链接'}
                </DropdownMenuItem>
              </>
            )}
            {file.isDirectory && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleCopyDirLink(); }}
              >
                {copied ? <Check className="h-4 w-4" /> : <FolderInput className="h-4 w-4" />}
                {copied ? '已复制' : '复制目录链接'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onAction('rename'); }}
            >
              <PenLine className="h-4 w-4" />
              重命名
            </DropdownMenuItem>
            {isAuthenticated && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); onAction('delete'); }}
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
