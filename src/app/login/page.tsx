'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GitBranch, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePwd, setMustChangePwd] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setMustChangePwd(false);
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        setLoading(false);
        return;
      }

      if (data.user?.mustChangePwd) {
        setMustChangePwd(true);
      }

      setSuccess(true);

      // Redirect after a short delay so user can see the warning
      setTimeout(() => {
        router.push(redirect);
        router.refresh();
      }, mustChangePwd ? 2500 : 500);
    } catch {
      setError('网络错误，请重试');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Must change password warning */}
        {mustChangePwd && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              首次登录后，请前往设置修改默认密码。
            </span>
          </div>
        )}

        {/* Success message */}
        {success && !mustChangePwd && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
            登录成功，正在跳转…
          </div>
        )}

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoComplete="username"
            className="bg-white/5"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            className="bg-white/5"
            required
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={loading || !username || !password}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              登录中…
            </>
          ) : (
            '登录'
          )}
        </Button>

        {/* Back to home */}
        <Link
          href="/"
          className="text-sm text-[#8b949e] transition-colors hover:text-[#e6edf3]"
        >
          &larr; 返回首页
        </Link>
      </CardFooter>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-[#0d1117]">
      {/* Branding */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <GitBranch className="h-6 w-6 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#e6edf3]">
          GitFileDock
        </h1>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md border-[#30363d] bg-[#161b22]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-[#e6edf3]">登录</CardTitle>
          <CardDescription className="text-[#8b949e]">
            输入凭据以访问管理面板
          </CardDescription>
        </CardHeader>

        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#8b949e]/50">
        GitFileDock &mdash; 轻量级 Git 文件服务器
      </p>
    </div>
  );
}
