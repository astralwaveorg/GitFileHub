import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { withSshKey } from '@/lib/ssh-key-helper';
import { autoCommitAndPush } from '@/lib/git';
import fs from 'fs/promises';
import path from 'path';
import { isTextFile } from '@/lib/constants';

/**
 * Helper: resolve repo from DB and validate the local path.
 */
async function resolveRepo(repoIdentifier: string) {
  // Try by ID first, then by name
  let repo = await prisma.repo.findUnique({
    where: { id: repoIdentifier },
    include: { sshKey: true },
  });
  if (!repo) {
    repo = await prisma.repo.findUnique({
      where: { name: repoIdentifier },
      include: { sshKey: true },
    });
  }
  return repo;
}

/**
 * Helper: check if a name matches any hidden path pattern.
 * Supports simple glob: exact match, or "*" wildcard (e.g., "*.log").
 */
function matchesHiddenPath(name: string, hiddenPatterns: string[]): boolean {
  for (const pattern of hiddenPatterns) {
    if (pattern.includes('*')) {
      // Escape all regex special chars first, then convert * to .*
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('^' + escaped + '$');
      if (regex.test(name)) return true;
    } else if (name === pattern) {
      return true;
    }
  }
  return false;
}

/**
 * GET /api/files/[repo]/[...path]
 * Public (no auth required).
 * If path is directory: list contents sorted (dirs first, then alphabetical).
 * If path is file: return file info + content for text files.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string; path: string[] }> }
) {
  try {
    const { repo: repoId, path: pathSegments } = await params;
    const repo = await resolveRepo(repoId);
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

    const hiddenPatterns: string[] = (() => {
      try { return JSON.parse(repo.hiddenPaths); } catch { return []; }
    })();

    // Check if path exists
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(fullPath);
    } catch {
      return NextResponse.json({ error: '路径不存在' }, { status: 404 });
    }

    if (stat.isDirectory()) {
      // List directory contents
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        if (matchesHiddenPath(entry.name, hiddenPatterns)) continue;

        const itemPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const itemStat = await fs.stat(path.join(fullPath, entry.name)).catch(() => null);
        if (!itemStat) continue;

        items.push({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          size: itemStat.size,
          modifiedAt: itemStat.mtime.toISOString(),
          path: itemPath,
        });
      }

      // Sort: directories first, then alphabetical
      items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({ success: true, type: 'directory', items });
    } else {
      // Return file info
      const ext = relativePath.split('.').pop() || '';
      const isText = isTextFile(relativePath);

      let content: string | undefined;
      if (isText && stat.size < 5 * 1024 * 1024) {
        try {
          content = await fs.readFile(fullPath, 'utf-8');
        } catch {
          // Ignore read errors, return file info without content
        }
      }

      return NextResponse.json({
        success: true,
        type: 'file',
        file: {
          name: path.basename(relativePath),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          path: relativePath,
          isText,
          extension: ext,
          content,
        },
      });
    }
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

/**
 * POST /api/files/[repo]/[...path]
 * Auth required. Create file or directory.
 * Body: { type: 'file' | 'directory', content?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string; path: string[] }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { repo: repoId, path: pathSegments } = await params;
    const repo = await resolveRepo(repoId);
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

    let body: { type?: string; content?: string };
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: '请求体无效' }, { status: 400 });
    }
    const { type, content } = body;

    if (type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      // Ensure parent directory exists
      const parentDir = path.dirname(fullPath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(fullPath, content || '', 'utf-8');
    }

    // Auto git add + commit + push
    const commitMsg = type === 'directory'
      ? `创建目录: ${relativePath}`
      : `创建文件: ${relativePath}`;

    await withSshKey(repo.sshKeyId, async (keyPath) => {
      const result = await autoCommitAndPush(repo.localPath, keyPath, commitMsg);
      if (!result.success) {
        console.error(`[GitFileDock] Auto commit failed:`, result.error);
      }
    });

    return NextResponse.json({ success: true, message: `${type === 'directory' ? '目录' : '文件'}创建成功` });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

/**
 * PUT /api/files/[repo]/[...path]
 * Auth required. Edit file content or rename.
 * Body: { content?: string, newName?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string; path: string[] }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { repo: repoId, path: pathSegments } = await params;
    const repo = await resolveRepo(repoId);
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

    let body: { content?: string; newName?: string };
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: '请求体无效' }, { status: 400 });
    }
    const { content, newName } = body;

    let commitMsg = '';

    if (newName) {
      // Security: validate newName does not contain path separators or traversal
      if (newName.includes('/') || newName.includes('\\') || newName.includes('..')) {
        return NextResponse.json({ error: '文件名无效' }, { status: 400 });
      }
      const parentDir = path.dirname(fullPath);
      const newPath = path.join(parentDir, newName);
      const resolvedNewPath = path.resolve(newPath);
      if (!resolvedNewPath.startsWith(resolvedBasePath + path.sep)) {
        return NextResponse.json({ error: '文件名无效' }, { status: 400 });
      }
      await fs.rename(fullPath, newPath);
      const newRelativePath = path.dirname(relativePath) ? `${path.dirname(relativePath)}/${newName}` : newName;
      commitMsg = `重命名: ${relativePath} -> ${newRelativePath}`;
    } else if (content !== undefined) {
      await fs.writeFile(fullPath, content, 'utf-8');
      commitMsg = `编辑文件: ${relativePath}`;
    } else {
      return NextResponse.json({ error: '没有提供要更新的内容' }, { status: 400 });
    }

    // Auto git add + commit + push
    await withSshKey(repo.sshKeyId, async (keyPath) => {
      const result = await autoCommitAndPush(repo.localPath, keyPath, commitMsg);
      if (!result.success) {
        console.error(`[GitFileDock] Auto commit failed:`, result.error);
      }
    });

    return NextResponse.json({ success: true, message: '操作成功' });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

/**
 * DELETE /api/files/[repo]/[...path]
 * Auth required. Delete file or directory.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string; path: string[] }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { repo: repoId, path: pathSegments } = await params;
    const repo = await resolveRepo(repoId);
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

    // Prevent deleting the repo root
    if (!relativePath || relativePath === '.') {
      return NextResponse.json({ error: '不能删除仓库根目录' }, { status: 400 });
    }

    await fs.rm(fullPath, { recursive: true, force: true });

    // Auto git add + commit + push
    await withSshKey(repo.sshKeyId, async (keyPath) => {
      const result = await autoCommitAndPush(repo.localPath, keyPath, `删除: ${relativePath}`);
      if (!result.success) {
        console.error(`[GitFileDock] Auto commit failed:`, result.error);
      }
    });

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
