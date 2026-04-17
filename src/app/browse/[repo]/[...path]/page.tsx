'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { FileList } from '@/components/file/FileList';
import { PreviewPanel, type PreviewFileInfo } from '@/components/preview/PreviewPanel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UploadDialog } from '@/components/common/UploadDialog';
import { CreateItemDialog } from '@/components/common/CreateItemDialog';
import { RenameDialog } from '@/components/common/RenameDialog';
import { Plus, Upload, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RepoInfo {
  id: string;
  name: string;
  branch: string;
  platform: string;
}

interface FileItemData {
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  path: string;
  childCount?: number;
}

type FileAction = 'preview' | 'edit' | 'download' | 'delete' | 'rename' | 'copyLink' | 'copyDirLink';

function BrowseContent() {
  const params = useParams();
  const router = useRouter();

  const repo = params.repo as string;
  const pathSegments = (params.path as string[]) || [];
  const currentPath = pathSegments.join('/');

  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [files, setFiles] = useState<FileItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [previewFile, setPreviewFile] = useState<PreviewFileInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItemData | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileItemData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/repos')
      .then(r => r.json())
      .then(data => setRepos(data.repos || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok)
      .then(ok => setIsAuthenticated(ok))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = currentPath
      ? `/api/files/${repo}/${currentPath}`
      : `/api/files/${repo}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setFiles(data.files || []);
        } else {
          toast.error(data.error || '加载失败');
          setFiles([]);
        }
      })
      .catch(() => {
        toast.error('网络错误');
        setFiles([]);
      })
      .finally(() => setLoading(false));
  }, [repo, currentPath]);

  const currentRepo = repos.find(r => r.name === repo);

  const handleFileAction = useCallback(async (file: FileItemData, action: FileAction) => {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;

    switch (action) {
      case 'preview':
        if (file.isDirectory) {
          router.push(`/browse/${repo}/${filePath}`);
        } else {
          setPreviewFile({
            name: file.name,
            path: filePath,
            size: file.size,
            isText: true,
            extension: file.name.split('.').pop()?.toLowerCase() || '',
          });
        }
        break;

      case 'edit':
        setPreviewFile({
          name: file.name,
          path: filePath,
          size: file.size,
          isText: true,
          extension: file.name.split('.').pop()?.toLowerCase() || '',
        });
        break;

      case 'download': {
        const url = `/api/files/${repo}/download/${filePath}`;
        window.open(url, '_blank');
        break;
      }

      case 'copyLink': {
        const url = `${window.location.origin}/raw/${repo}/${filePath}`;
        navigator.clipboard.writeText(url).then(
          () => toast.success('链接已复制'),
          () => toast.error('复制失败')
        );
        break;
      }

      case 'copyDirLink': {
        const url = `${window.location.origin}/browse/${repo}/${filePath}`;
        navigator.clipboard.writeText(url).then(
          () => toast.success('目录链接已复制'),
          () => toast.error('复制失败')
        );
        break;
      }

      case 'delete':
        setDeleteTarget(file);
        break;

      case 'rename':
        setRenameTarget(file);
        break;
    }
  }, [repo, currentPath, router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const filePath = currentPath ? `${currentPath}/${deleteTarget.name}` : deleteTarget.name;
    try {
      const res = await fetch(`/api/files/${repo}/${filePath}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`已删除 ${deleteTarget.name}`);
        setFiles(prev => prev.filter(f => f.name !== deleteTarget.name));
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('网络错误');
    }
    setDeleteTarget(null);
  };

  const handleSave = useCallback(async (path: string, content: string) => {
    const res = await fetch(`/api/files/${repo}/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '保存失败');
  }, [repo]);

  const handleSync = async () => {
    if (!currentRepo) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/repos/${currentRepo.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('同步成功');
        const url = currentPath ? `/api/files/${repo}/${currentPath}` : `/api/files/${repo}`;
        const filesRes = await fetch(url);
        const filesData = await filesRes.json();
        if (filesData.success) setFiles(filesData.files || []);
      } else {
        toast.error(data.error || '同步失败');
      }
    } catch {
      toast.error('同步失败');
    }
    setSyncing(false);
  };

  const reloadFiles = () => {
    const url = currentPath ? `/api/files/${repo}/${currentPath}` : `/api/files/${repo}`;
    fetch(url).then(r => r.json()).then(data => {
      if (data.success) setFiles(data.files || []);
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <Header
        repos={repos}
        currentRepo={currentRepo || null}
        onRepoSwitch={(r) => router.push(`/browse/${r.name}`)}
        onRepoSwitchById={(id) => {
          const r = repos.find(r => r.id === id);
          if (r) router.push(`/browse/${r.name}`);
        }}
        onSync={handleSync}
        syncing={syncing}
        isAuthenticated={isAuthenticated}
      />

      <div className="px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-3 flex-wrap">
          <Breadcrumb
            repoName={repo}
            path={currentPath}
            onNavigate={(navPath) => router.push(`/browse/${repo}${navPath ? '/' + navPath : ''}`)}
          />
          <div className="flex-1" />
          {isAuthenticated && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[#8b949e] hover:text-[#e6edf3] h-8"
                onClick={() => setShowCreateFile(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                新建文件
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[#8b949e] hover:text-[#e6edf3] h-8"
                onClick={() => setShowCreateFolder(true)}
              >
                <FolderPlus className="h-3.5 w-3.5" />
                新建文件夹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[#8b949e] hover:text-[#e6edf3] h-8"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                上传
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        <FileList
          files={files}
          loading={loading}
          onFileAction={handleFileAction}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {previewFile && (
        <PreviewPanel
          file={previewFile}
          repo={repo}
          onClose={() => setPreviewFile(null)}
          onSave={handleSave}
          onEdit={() => {}}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`删除 ${deleteTarget?.name || ''}`}
        description={`确定要删除 "${deleteTarget?.name}" 吗？${deleteTarget?.isDirectory ? '目录内的所有文件也会被删除。' : ''}此操作不可撤销。`}
        onConfirm={handleDelete}
        variant="destructive"
      />

      <UploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        repoId={repo}
        currentPath={currentPath}
        onSuccess={() => { setShowUpload(false); reloadFiles(); }}
      />

      <CreateItemDialog
        open={showCreateFile}
        onOpenChange={setShowCreateFile}
        type="file"
        repoId={repo}
        currentPath={currentPath}
        onSuccess={() => { setShowCreateFile(false); reloadFiles(); }}
      />

      <CreateItemDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        type="folder"
        repoId={repo}
        currentPath={currentPath}
        onSuccess={() => { setShowCreateFolder(false); reloadFiles(); }}
      />

      {renameTarget && (
        <RenameDialog
          open={!!renameTarget}
          onOpenChange={() => setRenameTarget(null)}
          repoId={repo}
          currentPath={currentPath}
          currentName={renameTarget.name}
          isDirectory={renameTarget.isDirectory}
          onSuccess={() => { setRenameTarget(null); reloadFiles(); }}
        />
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
