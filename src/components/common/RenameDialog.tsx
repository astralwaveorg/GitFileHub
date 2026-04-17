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

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoId: string;
  currentPath: string;
  currentName: string;
  isDirectory: boolean;
  onSuccess: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  repoId,
  currentPath,
  currentName,
  isDirectory,
  onSuccess,
}: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  function validateName(n: string): string | null {
    if (!n.trim()) return '名称不能为空';
    if (n.includes('/') || n.includes('\\')) return '名称不能包含 / 或 \\';
    const invalid = /[<>:"|?*]/;
    if (invalid.test(n)) return '名称包含非法字符';
    if (n === currentName) return '新名称与当前名称相同';
    return null;
  }

  async function handleRename() {
    const error = validateName(newName);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const targetPath = currentPath ? `${currentPath}/${currentName}` : currentName;
      const res = await fetch(`/api/files/${repoId}/${encodeURIComponent(targetPath)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '重命名失败');
        return;
      }

      toast.success('重命名成功');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('重命名失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setNewName(currentName);
      onOpenChange(false);
    }
  }

  // Reset name when dialog opens
  function handleOpenChange(val: boolean) {
    if (val) {
      setNewName(currentName);
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            重命名{isDirectory ? '文件夹' : '文件'}
          </DialogTitle>
          <DialogDescription>
            将 &quot;{currentName}&quot; 重命名
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="new-name">新名称</Label>
          <Input
            id="new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
            disabled={loading}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleRename} disabled={loading || !newName.trim()}>
            {loading ? '重命名中...' : '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
