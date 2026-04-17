import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createReadStream, stat } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

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
    if (!resolvedFullPath.startsWith(resolvedBasePath + path.sep) && resolvedFullPath !== resolvedBasePath) {
      return NextResponse.json({ error: '路径无效' }, { status: 400 });
    }

    const fileStat = await fs.stat(resolvedFullPath).catch(() => null);
    if (!fileStat) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    if (fileStat.isFile()) {
      const fileName = path.basename(relativePath);
      // Stream file instead of buffering entirely in memory
      const fileStream = createReadStream(resolvedFullPath);
      const readable = Readable.from(fileStream);

      return new NextResponse(readable as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          'Content-Length': String(fileStat.size),
        },
      });
    } else if (fileStat.isDirectory()) {
      // Create ZIP archive on the fly
      const archiver = await import('archiver');

      const dirName = path.basename(relativePath) || repo.name;
      const archive = archiver.default('zip', { zlib: { level: 5 } });

      // Stream the archive directly to the response
      const { Readable: NodeReadable, PassThrough } = await import('stream');
      const passThrough = new PassThrough();
      archive.pipe(passThrough);

      archive.directory(resolvedFullPath, dirName);
      archive.finalize();

      const nodeReadable = NodeReadable.from(passThrough);

      return new NextResponse(nodeReadable as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(dirName)}.zip`,
        },
      });
    }

    return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
