'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CopyButton } from '@/components/common/CopyButton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Key,
  User,
  LogOut,
  Loader2,
  GitBranch,
  Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RepoItem {
  id: string;
  name: string;
  branch: string;
  platform: string;
  hiddenPaths: string;
  autoPullInterval: number;
  webhookSecret: string;
  createdAt: string;
}

interface SSHKeyItem {
  id: string;
  name: string;
  fingerprint: string;
  createdAt: string;
  repoCount: number;
}

interface UserInfo {
  id: string;
  username: string;
  mustChangePwd: boolean;
  createdAt: string;
}

const SYNC_INTERVALS: Record<number, string> = {
  0: '关闭',
  30: '30 分钟',
  60: '1 小时',
  120: '2 小时',
  240: '4 小时',
};

const PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'gitea', label: 'Gitea' },
  { value: 'gitee', label: 'Gitee' },
];

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[#161b22]/80 backdrop-blur-sm">
        <div className="flex h-12 items-center gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">返回</span>
          </Link>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            <h1 className="font-semibold text-[#e6edf3]">设置</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="repos">
          <TabsList variant="line" className="w-full justify-start border-b border-[#30363d] mb-6">
            <TabsTrigger value="repos" className="gap-1.5">
              <GitBranch className="h-4 w-4" />
              仓库管理
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-1.5">
              <Key className="h-4 w-4" />
              SSH 密钥
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-4 w-4" />
              个人信息
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repos">
            <RepoManagementTab />
          </TabsContent>
          <TabsContent value="keys">
            <SSHKeysTab />
          </TabsContent>
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Repo Management Tab ──────────────────────────────────────────────────────

function RepoManagementTab() {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editRepo, setEditRepo] = useState<RepoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RepoItem | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  // Fetch repos on mount and refresh
  useEffect(() => {
    let cancelled = false;
    fetch('/api/repos')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setRepos(data.repos);
      })
      .catch(() => {
        toast.error('获取仓库列表失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleSync(repo: RepoItem) {
    setSyncing(repo.id);
    try {
      const res = await fetch(`/api/repos/${repo.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('同步成功');
      } else {
        toast.error(data.error || '同步失败');
      }
    } catch {
      toast.error('同步失败');
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/repos/${deleteTarget.id}?deleteLocal=true`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('仓库已删除');
        setRepos((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#e6edf3]">仓库列表</h2>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          添加仓库
        </Button>
      </div>

      {/* Repo list */}
      {repos.length === 0 ? (
        <div className="text-center py-12 text-[#8b949e]">
          <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>暂无仓库</p>
          <p className="text-sm mt-1">点击上方按钮添加第一个 Git 仓库</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 hover:border-[#484f58] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Repo info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-medium text-[#e6edf3] truncate">{repo.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-normal border-[#30363d] text-[#8b949e]">
                      {repo.branch}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal capitalize bg-[#30363d]/50 text-[#8b949e]">
                      {repo.platform}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b949e]">
                    <span>同步间隔: {SYNC_INTERVALS[repo.autoPullInterval] || '关闭'}</span>
                    <div className="flex items-center gap-1">
                      <span>Webhook 密钥:</span>
                      <code className="bg-[#0d1117] border border-[#30363d] px-1.5 py-0.5 rounded text-[10px] max-w-48 truncate font-mono">
                        {repo.webhookSecret || '—'}
                      </code>
                      {repo.webhookSecret && <CopyButton text={repo.webhookSecret} />}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleSync(repo)}
                    disabled={syncing === repo.id}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing === repo.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditRepo(repo)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(repo)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Repo Dialog */}
      <AddRepoDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={triggerRefresh}
      />

      {/* Edit Repo Dialog */}
      {editRepo && (
        <EditRepoDialog
          repo={editRepo}
          open={!!editRepo}
          onOpenChange={(open) => !open && setEditRepo(null)}
          onSuccess={triggerRefresh}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除仓库"
        description={`确定要删除仓库 "${deleteTarget?.name}" 吗？此操作将同时删除本地文件，且不可撤销。`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}

// ─── Add Repo Dialog ──────────────────────────────────────────────────────────

interface RepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function AddRepoDialog({ open, onOpenChange, onSuccess }: RepoDialogProps) {
  const [name, setName] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [sshKeyId, setSshKeyId] = useState('');
  const [branch, setBranch] = useState('main');
  const [platform, setPlatform] = useState('github');
  const [hiddenPathsText, setHiddenPathsText] = useState('.git\nnode_modules\n*.log');
  const [autoPullInterval, setAutoPullInterval] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<SSHKeyItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchKeys();
    }
  }, [open]);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch {
      // ignore
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !remoteUrl.trim() || !sshKeyId) {
      toast.error('请填写必填字段');
      return;
    }

    setLoading(true);
    try {
      const hiddenPaths = hiddenPathsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          remoteUrl: remoteUrl.trim(),
          sshKeyId,
          branch,
          platform,
          hiddenPaths,
          autoPullInterval,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '添加仓库失败');
        return;
      }

      toast.success('仓库添加成功，正在克隆...');
      handleClose();
      onSuccess();
    } catch {
      toast.error('添加仓库失败');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName('');
    setRemoteUrl('');
    setSshKeyId('');
    setBranch('main');
    setPlatform('github');
    setHiddenPathsText('.git\nnode_modules\n*.log');
    setAutoPullInterval(0);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加仓库</DialogTitle>
          <DialogDescription>添加一个新的 Git 仓库到文件管理器</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-name">仓库名称 *</Label>
            <Input id="repo-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-project" disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-url">远程地址 *</Label>
            <Input id="repo-url" value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} placeholder="git@github.com:user/repo.git" disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label>SSH 密钥 *</Label>
            <Select value={sshKeyId} onValueChange={(v) => v && setSshKeyId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择 SSH 密钥" />
              </SelectTrigger>
              <SelectContent>
                {keys.length === 0 && (
                  <SelectItem value="__none" disabled>暂无密钥，请先添加</SelectItem>
                )}
                {keys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.name} ({key.fingerprint.slice(-4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repo-branch">分支</Label>
              <Input id="repo-branch" value={branch} onChange={(e) => setBranch(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>平台</Label>
              <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hidden-paths">隐藏路径</Label>
            <Textarea
              id="hidden-paths"
              value={hiddenPathsText}
              onChange={(e) => setHiddenPathsText(e.target.value)}
              placeholder={'.git\nnode_modules\n*.log'}
              rows={3}
              disabled={loading}
              className="font-mono text-xs"
            />
            <p className="text-xs text-[#8b949e]">每行一个路径模式，支持 * 通配符</p>
          </div>

          <div className="space-y-2">
            <Label>自动同步间隔</Label>
            <Select value={String(autoPullInterval)} onValueChange={(v) => v && setAutoPullInterval(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SYNC_INTERVALS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !remoteUrl.trim() || !sshKeyId}>
            {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />添加中...</> : '添加仓库'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Repo Dialog ─────────────────────────────────────────────────────────

interface EditRepoDialogProps extends RepoDialogProps {
  repo: RepoItem;
}

function EditRepoDialog({ open, onOpenChange, repo, onSuccess }: EditRepoDialogProps) {
  const [branch, setBranch] = useState(repo.branch);
  const [platform, setPlatform] = useState(repo.platform);
  const [hiddenPathsText, setHiddenPathsText] = useState(() => {
    try {
      return JSON.parse(repo.hiddenPaths).join('\n');
    } catch {
      return repo.hiddenPaths;
    }
  });
  const [autoPullInterval, setAutoPullInterval] = useState(repo.autoPullInterval);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const hiddenPaths = hiddenPathsText
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/repos/${repo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          platform,
          hiddenPaths,
          autoPullInterval,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '更新失败');
        return;
      }

      toast.success('仓库设置已更新');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑仓库 — {repo.name}</DialogTitle>
          <DialogDescription>修改仓库配置</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-branch">分支</Label>
              <Input id="edit-branch" value={branch} onChange={(e) => setBranch(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>平台</Label>
              <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-hidden-paths">隐藏路径</Label>
            <Textarea
              id="edit-hidden-paths"
              value={hiddenPathsText}
              onChange={(e) => setHiddenPathsText(e.target.value)}
              rows={3}
              disabled={loading}
              className="font-mono text-xs"
            />
            <p className="text-xs text-[#8b949e]">每行一个路径模式，支持 * 通配符</p>
          </div>

          <div className="space-y-2">
            <Label>自动同步间隔</Label>
            <Select value={String(autoPullInterval)} onValueChange={(v) => v && setAutoPullInterval(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SYNC_INTERVALS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>取消</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />保存中...</> : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SSH Keys Tab ─────────────────────────────────────────────────────────────

function SSHKeysTab() {
  const [keys, setKeys] = useState<SSHKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SSHKeyItem | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  // Fetch keys on mount and refresh
  useEffect(() => {
    let cancelled = false;
    fetch('/api/keys')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setKeys(data.keys);
      })
      .catch(() => {
        toast.error('获取密钥列表失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/keys/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('密钥已删除');
        setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#e6edf3]">SSH 密钥列表</h2>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          添加密钥
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-12 text-[#8b949e]">
          <Key className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>暂无 SSH 密钥</p>
          <p className="text-sm mt-1">点击上方按钮添加 SSH 密钥</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 hover:border-[#484f58] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="font-medium text-[#e6edf3]">{key.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                    <span>指纹: ••••••••{key.fingerprint.slice(-4)}</span>
                    <span>创建于: {new Date(key.createdAt).toLocaleDateString('zh-CN')}</span>
                    {key.repoCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 font-normal bg-[#30363d]/50 text-[#8b949e]">
                        {key.repoCount} 个仓库使用中
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(key)}
                  disabled={key.repoCount > 0}
                >
                  <Trash2 className={`h-4 w-4 ${key.repoCount > 0 ? 'text-[#8b949e]/30' : 'text-red-400'}`} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Key Dialog */}
      <AddKeyDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={triggerRefresh} />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除 SSH 密钥"
        description={
          deleteTarget?.repoCount
            ? `密钥 "${deleteTarget?.name}" 正在被 ${deleteTarget?.repoCount} 个仓库使用，无法删除。请先解除关联。`
            : `确定要删除密钥 "${deleteTarget?.name}" 吗？此操作不可撤销。`
        }
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}

// ─── Add Key Dialog ───────────────────────────────────────────────────────────

function AddKeyDialog({ open, onOpenChange, onSuccess }: RepoDialogProps) {
  const [name, setName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !privateKey.trim()) {
      toast.error('请填写所有字段');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), privateKey: privateKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '添加密钥失败');
        return;
      }

      toast.success('SSH 密钥添加成功');
      setName('');
      setPrivateKey('');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('添加密钥失败');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName('');
    setPrivateKey('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加 SSH 密钥</DialogTitle>
          <DialogDescription>添加一个新的 SSH 私钥用于 Git 操作</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">名称</Label>
            <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-server-key" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-private">私钥内容</Label>
            <Textarea
              id="key-private"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
              rows={8}
              disabled={loading}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !privateKey.trim()}>
            {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />添加中...</> : '添加密钥'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch user on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少需要 6 个字符');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '修改密码失败');
        return;
      }

      toast.success('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('修改密码失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('退出登录失败');
    }
  }

  if (!user) {
    return <Skeleton className="h-40 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Current user info */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
            <User className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-[#e6edf3]">{user.username}</p>
            <p className="text-xs text-[#8b949e]">
              创建于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
        <h3 className="font-medium mb-4 text-[#e6edf3]">修改密码</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pwd">当前密码</Label>
            <Input
              id="current-pwd"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pwd">新密码</Label>
            <Input
              id="new-pwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pwd">确认新密码</Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
            {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />修改中...</> : '修改密码'}
          </Button>
        </form>
      </div>

      {/* Logout */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
        <h3 className="font-medium mb-3 text-[#e6edf3]">退出登录</h3>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
  );
}
