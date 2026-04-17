'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileIcon as FileIconLucide } from 'lucide-react';
import { toast } from 'sonner';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoId: string;
  currentPath: string;
  onSuccess: () => void;
}

export function UploadDialog({ open, onOpenChange, repoId, currentPath, onSuccess }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await fetch(
        `/api/files/${repoId}/upload?path=${encodeURIComponent(currentPath)}&overwrite=true`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '上传失败');
        return;
      }

      toast.success(data.message || '上传成功');
      setFiles([]);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (!uploading) {
      setFiles([]);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传文件</DialogTitle>
          <DialogDescription>
            上传到: {currentPath || '/'}
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-muted-foreground/20 hover:border-muted-foreground/40'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            拖拽文件到此处，或点击选择文件
          </p>
          <label className="cursor-pointer inline-flex">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button variant="outline" size="sm" type="button" tabIndex={-1}>
              选择文件
            </Button>
          </label>
        </div>

        {files.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
              >
                <FileIconLucide className="h-4 w-4 shrink-0 text-[#8b949e]" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? (
              <>
                <span className="animate-spin mr-1">⏳</span>
                上传中...
              </>
            ) : (
              `上传 ${files.length > 0 ? `(${files.length} 个文件)` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
