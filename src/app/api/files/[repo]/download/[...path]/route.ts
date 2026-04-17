import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { stat } from 'fs/promises';

/**
 * GET /api/files/[repo]/download/[...path]
 * Public (no auth required).
 * If file: stream file with Content-Disposition header.
 * If directory: create ZIP archive on the fly, stream it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string; path: string[] }> }
) {
  try {
    const { repo: repoId, path: pathSegments } = await params;
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) {
      return NextResponse.json({ error: '仓库不存在' }, { status: 404 });
    }

    const relativePath = pathSegments.join('/');
    const fullPath = path.join(repo.localPath, relativePath);

    // Security: prevent path traversal
    const resolvedFullPath = path.resolve(fullPath);
    const resolvedBasePath = path.resolve(repo.localPath);
    if (!resolvedFullPath.startsWith(resolvedBasePath)) {
      return NextResponse.json({ error: '路径无效' }, { status: 400 });
    }

    const fileStat = await stat(resolvedFullPath).catch(() => null);
    if (!fileStat) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    if (fileStat.isFile()) {
      const buffer = await fs.readFile(resolvedFullPath);
      const fileName = path.basename(relativePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          'Content-Length': String(buffer.length),
        },
      });
    } else if (fileStat.isDirectory()) {
      // Create ZIP archive on the fly
      const archiver = await import('archiver');
      const { Writable } = await import('stream');

      const dirName = path.basename(relativePath) || repo.name;
      const archive = archiver.default('zip', { zlib: { level: 5 } });

      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });

      archive.pipe(writable);
      archive.directory(resolvedFullPath, dirName);

      await new Promise<void>((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
        archive.finalize();
      });

      const zipBuffer = Buffer.concat(chunks);
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(dirName)}.zip`,
          'Content-Length': String(zipBuffer.length),
        },
      });
    }

    return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
