export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'h': 'cpp',
  'hpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'swift': 'swift',
  'kt': 'kotlin',
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'scss',
  'less': 'less',
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'xml': 'xml',
  'sql': 'sql',
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'ps1': 'powershell',
  'md': 'markdown',
  'markdown': 'markdown',
  'lua': 'lua',
  'r': 'r',
  'dart': 'dart',
  'vue': 'html',
  'svelte': 'html',
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'tf': 'hcl',
  'ini': 'ini',
  'conf': 'ini',
  'env': 'ini',
  'gitignore': 'ini',
  'editorconfig': 'ini',
  'proto': 'protobuf',
  'graphql': 'graphql',
  'gql': 'graphql',
  'txt': 'plaintext',
  'log': 'plaintext',
  'csv': 'plaintext',
};

export const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'avif']);
export const PDF_EXTENSIONS = new Set(['pdf']);
export const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'avi', 'mov', 'mkv']);
export const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac']);
export const BINARY_EXTENSIONS = new Set([
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar',
  'exe', 'dll', 'so', 'dylib',
  'bin', 'dat',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
]);

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return '';
}

export function isTextFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  if (SUPPORTED_LANGUAGES[ext]) return true;
  if (ext === '') return true; // files without extension might be text
  if (['env', 'gitignore', 'editorconfig', 'dockerignore', 'prettierrc', 'eslintrc'].includes(ext)) return true;
  return false;
}

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(filename));
}

export function isPdfFile(filename: string): boolean {
  return PDF_EXTENSIONS.has(getFileExtension(filename));
}

export function isBinaryFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return BINARY_EXTENSIONS.has(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return '刚刚'; // Handle clock skew
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString('zh-CN');
}
