'use client';

import {
  Folder,
  FileCode,
  Image,
  File,
  FileArchive,
  FileVideo,
  FileAudio,
  type LucideIcon,
} from 'lucide-react';
import { getFileExtension } from '@/lib/constants';

interface FileIconProps {
  filename: string;
  isDirectory: boolean;
  className?: string;
}

const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp',
  'cs', 'php', 'swift', 'kt', 'html', 'htm', 'css', 'scss', 'sass', 'less',
  'json', 'yaml', 'yml', 'toml', 'xml', 'sql', 'sh', 'bash', 'lua', 'r', 'dart',
  'vue', 'svelte', 'tf', 'proto', 'graphql', 'md', 'txt', 'env', 'gitignore',
  'editorconfig', 'dockerfile', 'makefile', 'ini', 'conf', 'log',
]);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'avi', 'mov', 'mkv']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac']);
const ARCHIVE_EXTENSIONS = new Set(['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar']);

function getIconForFile(filename: string): { icon: LucideIcon; color: string } {
  const ext = getFileExtension(filename).toLowerCase();

  if (IMAGE_EXTENSIONS.has(ext)) return { icon: Image, color: 'text-purple-400' };
  if (VIDEO_EXTENSIONS.has(ext)) return { icon: FileVideo, color: 'text-pink-400' };
  if (AUDIO_EXTENSIONS.has(ext)) return { icon: FileAudio, color: 'text-orange-400' };
  if (ext === 'pdf') return { icon: FileCode, color: 'text-red-400' };
  if (ARCHIVE_EXTENSIONS.has(ext)) return { icon: FileArchive, color: 'text-yellow-400' };
  if (CODE_EXTENSIONS.has(ext)) return { icon: FileCode, color: 'text-blue-400' };
  if (ext === 'md' || ext === 'markdown') return { icon: FileCode, color: 'text-emerald-400' };

  return { icon: File, color: 'text-[#8b949e]' };
}

export function FileIcon({ filename, isDirectory, className = 'h-4 w-4' }: FileIconProps) {
  if (isDirectory) {
    return <Folder className={`${className} text-blue-400`} />;
  }

  const { icon: Icon, color } = getIconForFile(filename);
  return <Icon className={`${className} ${color}`} />;
}
