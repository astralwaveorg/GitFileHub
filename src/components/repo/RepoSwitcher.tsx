'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Settings, GitBranch } from 'lucide-react';
import Link from 'next/link';

export interface RepoInfo {
  id: string;
  name: string;
  branch: string;
  platform: string;
}

interface RepoSwitcherProps {
  repos: RepoInfo[];
  currentRepoId: string;
  onSwitch: (repoId: string) => void;
}

export function RepoSwitcher({ repos, currentRepoId, onSwitch }: RepoSwitcherProps) {
  const currentRepo = repos.find((r) => r.id === currentRepoId);

  if (!currentRepo || repos.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
        <span className="max-w-32 truncate">{currentRepo.name}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
          {currentRepo.branch}
        </Badge>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>切换仓库</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {repos.map((repo) => (
          <DropdownMenuItem
            key={repo.id}
            onClick={() => onSwitch(repo.id)}
            className={repo.id === currentRepoId ? 'bg-accent' : ''}
          >
            <GitBranch className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="flex-1">{repo.name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal ml-2">
              {repo.branch}
            </Badge>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="h-4 w-4 mr-2" />
          管理仓库
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
