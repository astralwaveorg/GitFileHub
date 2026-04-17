'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  repoName: string;
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ repoName, path, onNavigate }: BreadcrumbProps) {
  const segments = path ? path.split('/') : [];

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      {/* Home / Repo name */}
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      >
        <Home className="h-3.5 w-3.5" />
        <span>{repoName}</span>
      </button>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const segmentPath = segments.slice(0, index + 1).join('/');

        return (
          <span key={segmentPath} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            {isLast ? (
              <span className="px-1.5 py-1 text-foreground whitespace-nowrap">
                {segment}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(segmentPath)}
                className="px-1.5 py-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {segment}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
