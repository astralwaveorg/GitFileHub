'use client';

import { GitBranch, Settings, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RepoSwitcher, type RepoInfo } from '@/components/repo/RepoSwitcher';

interface HeaderProps {
  repos?: RepoInfo[];
  currentRepo?: RepoInfo | null;
  onRepoSwitch?: (repo: RepoInfo) => void;
  onRepoSwitchById?: (repoId: string) => void;
  onSync?: () => void;
  syncing?: boolean;
  isAuthenticated?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Header({
  repos = [],
  currentRepo = null,
  onRepoSwitch,
  onRepoSwitchById,
  onSync,
  syncing = false,
  isAuthenticated = false,
  children,
  actions,
}: HeaderProps) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[#161b22]/80 backdrop-blur-sm">
      <div className="flex h-12 items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <GitBranch className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline text-[#e6edf3]">GitFileDock</span>
        </Link>

        {/* Repo Switcher */}
        {repos.length > 0 && (
          <div className="shrink-0">
            <RepoSwitcher
              repos={repos}
              currentRepoId={currentRepo?.id || ''}
              onSwitch={(id) => {
                const r = repos.find(r => r.id === id);
                if (r && onRepoSwitch) onRepoSwitch(r);
                else if (r && onRepoSwitchById) onRepoSwitchById(r.id);
              }}
            />
          </div>
        )}

        {/* Center content */}
        <div className="flex-1 flex items-center gap-3 min-w-0 overflow-hidden">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}

        {/* Sync Button */}
        {onSync && currentRepo && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSync}
            disabled={syncing}
            className="text-[#8b949e] hover:text-[#e6edf3]"
            title="同步仓库"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        )}

        {/* Settings */}
        <Link href="/settings">
          <Button variant="ghost" size="icon-sm" className="text-[#8b949e] hover:text-[#e6edf3]">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>

        {/* Logout */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="text-[#8b949e] hover:text-[#f85149]"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
