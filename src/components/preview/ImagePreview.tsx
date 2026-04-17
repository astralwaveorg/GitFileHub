'use client';

import { useState } from 'react';
import { Maximize2, Minimize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/constants';

interface ImagePreviewProps {
  src: string;
  filename: string;
  size: number;
}

export function ImagePreview({ src, filename, size }: ImagePreviewProps) {
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#8b949e] gap-3 p-4">
        <p>图片加载失败</p>
        <Button variant="outline" size="sm" onClick={() => setError(false)}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#30363d]/50 bg-[#0d1117] shrink-0">
        <span className="text-xs text-[#8b949e] mr-auto">图片</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setZoomMode(zoomMode === 'fit' ? 'actual' : 'fit')}
          className="text-[#8b949e]"
        >
          {zoomMode === 'fit' ? (
            <>
              <Maximize2 className="h-3 w-3 mr-1" />
              实际大小
            </>
          ) : (
            <>
              <Minimize2 className="h-3 w-3 mr-1" />
              适应窗口
            </>
          )}
        </Button>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-[#0d1117] p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={filename}
          className={`max-w-full transition-all ${
            zoomMode === 'fit' ? 'max-h-full object-contain' : 'max-h-none'
          }`}
          onError={() => setError(true)}
        />
      </div>

      {/* Footer info */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-[#30363d]/50 bg-[#0d1117] shrink-0">
        <span className="text-xs text-[#8b949e] truncate">{filename}</span>
        <span className="text-xs text-[#8b949e]/60">{formatFileSize(size)}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto text-[#8b949e]"
          onClick={() => {
            const a = document.createElement('a');
            a.href = src;
            a.download = filename;
            a.click();
          }}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
