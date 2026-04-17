import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { withSshKey } from '@/lib/ssh-key-helper';
import { autoCommitAndPush } from '@/lib/git';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

/**
 * POST /api/files/[repo]/upload
 * Auth required. Multipart upload files to a repo path.
 * Query params: path (target directory), overwrite (boolean).
 * Reads repoId from URL path segment.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { repo: repoId } = await params;
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path') || '';
    const overwrite = searchParams.get('overwrite') === 'true';

    if (!repoId) {
      return NextResponse.json({ error: '缺少仓库ID' }, { status: 400 });
    }

    const repo = await prisma.repo.findUnique({
      where: { id: repoId },
      include: { sshKey: true },
    });

    if (!repo) {
      return NextResponse.json({ error: '仓库不存在' }, { status: 404 });
    }

    // Security: prevent path traversal
    const fullTargetPath = path.join(repo.localPath, targetPath);
    const resolvedTargetPath = path.resolve(fullTargetPath);
    const resolvedBasePath = path.resolve(repo.localPath);
    if (!resolvedTargetPath.startsWith(resolvedBasePath)) {
      return NextResponse.json({ error: '路径无效' }, { status: 400 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 });
    }

    // Ensure target directory exists
    await fs.mkdir(resolvedTargetPath, { recursive: true });

    const uploaded: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      const filePath = path.join(resolvedTargetPath, file.name);
      const exists = await fs.stat(filePath).then(() => true).catch(() => false);

      if (exists && !overwrite) {
        skipped.push(file.name);
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      uploaded.push(file.name);
    }

    // Auto git add + commit + push
    if (uploaded.length > 0) {
      const commitMsg = `上传文件: ${uploaded.join(', ')}`;
      await withSshKey(repo.sshKeyId, async (keyPath) => {
        const result = await autoCommitAndPush(repo.localPath, keyPath, commitMsg);
        if (!result.success) {
          console.error(`[GitFileDock] Auto commit failed:`, result.error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      uploaded,
      skipped,
      message: `成功上传 ${uploaded.length} 个文件${skipped.length > 0 ? `，跳过 ${skipped.length} 个已存在文件` : ''}`,
    });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
