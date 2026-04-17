'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'file' | 'folder';
  repoId: string;
  currentPath: string;
  onSuccess: () => void;
}

export function CreateItemDialog({
  open,
  onOpenChange,
  type,
  repoId,
  currentPath,
  onSuccess,
}: CreateItemDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const title = type === 'file' ? '新建文件' : '新建文件夹';
  const placeholder = type === 'file' ? '例如：example.ts' : '例如：components';

  function validateName(n: string): string | null {
    if (!n.trim()) return '名称不能为空';
    if (n.includes('/') || n.includes('\\')) return '名称不能包含 / 或 \\';
    if (n.startsWith('.')) return '名称不能以点开头';
    const invalid = /[<>:"|?*]/;
    if (invalid.test(n)) return '名称包含非法字符';
    return null;
  }

  async function handleCreate() {
    const error = validateName(name);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const targetPath = currentPath ? `${currentPath}/${name}` : name;
      const res = await fetch(`/api/files/${repoId}/${encodeURIComponent(targetPath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type === 'folder' ? 'directory' : 'file', content: '' }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '创建失败');
        return;
      }

      toast.success(`${title}创建成功`);
      setName('');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setName('');
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            在 {currentPath || '/'} 下创建{type === 'file' ? '文件' : '文件夹'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="item-name">名称</Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
            disabled={loading}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
