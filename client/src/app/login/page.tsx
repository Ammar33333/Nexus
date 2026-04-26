'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = res.data.data;
      login(user, accessToken, refreshToken);
      toast.success('Login successful');

      if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (user.role === 'SUPERVISOR') router.push('/supervisor/dashboard');
      else router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-primary/[0.04] blur-[80px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-emerald-400/[0.03] blur-[80px]" />
      </div>

      <Card className="relative w-full max-w-md border-primary/10 shadow-2xl shadow-black/40 backdrop-blur-sm transition-all duration-500 focus-within:border-primary/25 focus-within:shadow-[0_0_40px_rgba(16,185,129,0.08)]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 font-bold text-3xl tracking-[0.25em] px-6 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-gradient-brand">
            NEXUS
          </div>
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground/80">Sign in to your FYP Management Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@university.edu" {...register('email')} className="bg-muted/30 border-border/60 focus:border-primary/40" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••" {...register('password')} className="bg-muted/30 border-border/60 focus:border-primary/40" />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
