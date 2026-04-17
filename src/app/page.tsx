'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch, ArrowRight, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RepoInfo {
  id: string;
  name: string;
  branch: string;
}

export default function HomePage() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/repos')
      .then(r => r.json())
      .then(data => {
        if (data.repos && data.repos.length > 0) {
          router.replace(`/browse/${data.repos[0].name}`);
          return;
        }
        setRepos(data.repos || []);
      })
      .catch(() => setRepos([]));

    fetch('/api/auth/me')
      .then(r => r.ok)
      .then(ok => setIsAuthenticated(ok))
      .catch(() => {});
  }, [router]);

  if (repos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 h-12 border-b border-[#30363d] bg-[#161b22]/80">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <GitBranch className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-sm text-[#e6edf3]">GitFileDock</span>
          </Link>
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.reload();
                }}
                className="text-[#8b949e] hover:text-[#f85149] gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#8b949e] hover:text-[#e6edf3]">
                  登录
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon-sm" className="text-[#8b949e] hover:text-[#e6edf3]">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto">
              <GitBranch className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2 text-[#e6edf3]">
                GitFileDock
              </h1>
              <p className="text-[#8b949e] max-w-md">
                轻量级 Git 文件服务器。通过 Web 界面管理多个 Git 仓库，浏览、预览、编辑、上传、下载文件。
              </p>
            </div>
            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-[#8b949e]">请先登录，然后添加 Git 仓库</p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/login">
                    <Button size="lg">登录</Button>
                  </Link>
                  <Link href="/settings">
                    <Button size="lg" variant="outline">
                      设置
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Link href="/settings">
                <Button size="lg">
                  添加仓库
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#8b949e]">
        <GitBranch className="h-5 w-5 text-emerald-400 animate-spin" />
        <span>加载中...</span>
      </div>
    </div>
  );
}
