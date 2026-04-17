import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { getFileExtension } from '@/lib/constants';

const MIME_TYPES: Record<string, string> = {
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'mjs': 'text/javascript',
  'json': 'application/json',
  'xml': 'application/xml',
  'svg': 'image/svg+xml',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'ico': 'image/x-icon',
  'pdf': 'application/pdf',
  'md': 'text/markdown',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'yaml': 'text/yaml',
  'yml': 'text/yaml',
  'toml': 'text/plain',
  'sh': 'text/x-shellscript',
  'bash': 'text/x-shellscript',
  'ts': 'text/typescript',
  'tsx': 'text/typescript',
  'jsx': 'text/javascript',
  'py': 'text/x-python',
  'rs': 'text/x-rust',
  'go': 'text/x-go',
  'java': 'text/x-java',
  'c': 'text/x-c',
  'cpp': 'text/x-c++',
  'h': 'text/x-c',
  'rb': 'text/x-ruby',
  'php': 'text/x-php',
  'vue': 'text/html',
  'svelte': 'text/html',
  'log': 'text/plain',
};

/**
 * GET /raw/[repo]/[...path]
 * No auth required. Return raw file content with appropriate Content-Type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string; path: string[] }> }
) {
  try {
    const { repo: repoIdentifier, path: pathSegments } = await params;
    // Try by ID first, then by name
    let repo = await prisma.repo.findUnique({ where: { id: repoIdentifier } });
    if (!repo) {
      repo = await prisma.repo.findUnique({ where: { name: repoIdentifier } });
    }
    if (!repo) {
      return NextResponse.json({ error: '仓库不存在' }, { status: 404 });
    }

    const relativePath = pathSegments.join('/');
    const fullPath = path.join(repo.localPath, relativePath);

    // Security: prevent path traversal
    const resolvedFullPath = path.resolve(fullPath);
    const resolvedBasePath = path.resolve(repo.localPath);
    if (!resolvedFullPath.startsWith(resolvedBasePath + path.sep) && resolvedFullPath !== resolvedBasePath) {
      return NextResponse.json({ error: '路径无效' }, { status: 400 });
    }

    const fileStat = await fs.stat(resolvedFullPath).catch(() => null);
    if (!fileStat || !fileStat.isFile()) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    const buffer = await fs.readFile(resolvedFullPath);
    const ext = getFileExtension(relativePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = path.basename(relativePath);

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=3600',
    };

    // Add CSP header for SVG to prevent XSS
    if (ext === 'svg') {
      headers['Content-Security-Policy'] = "script-src 'none'";
    }

    return new NextResponse(buffer, { headers });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
