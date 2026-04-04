'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, FileText, Send, ClipboardList, Settings, Layout, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout, isAuthenticated, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/notifications')
      .then((res) => {
        setUnreadCount(res.data.data.unreadCount);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'STUDENT') return;
    api
      .get('/projects/me')
      .then((res) => {
        const projects = res.data.data || [];
        const withWorkspace = projects.find(
          (p: { workspace?: { id: string } }) => p.workspace
        );
        if (withWorkspace) {
          setWorkspaceId(withWorkspace.workspace.id);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, user?.role]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'SUPERVISOR'
        ? '/supervisor/dashboard'
        : '/dashboard';

  if (!isAuthenticated) return null;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href={dashboardPath}
            className="font-bold text-lg border px-4 py-1"
          >
            NEXUS
          </Link>
          <Link href={dashboardPath}>
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>

          {user?.role === 'STUDENT' && (
            <Link href="/requests">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Send className="h-4 w-4" />
                My Requests
              </Button>
            </Link>
          )}

          {user?.role === 'STUDENT' && workspaceId && (
            <Link href={`/workspace/${workspaceId}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <FileText className="h-4 w-4" />
                Workspace
              </Button>
            </Link>
          )}

          {user?.role === 'SUPERVISOR' && (
            <>
              <Link href="/supervisor/requests">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Send className="h-4 w-4" />
                  Requests
                </Button>
              </Link>
              <Link href="/supervisor/proposals">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  Proposals
                </Button>
              </Link>
              <Link href="/supervisor/evaluations">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Star className="h-4 w-4" />
                  Evaluations
                </Button>
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link href="/admin/proposals">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  Proposals
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href="/admin/templates">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Layout className="h-4 w-4" />
                  Templates
                </Button>
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white text-xs">
                {unreadCount}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="inline-block h-6 w-6 rounded-full bg-gray-300" />
              {user?.role}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium">
                {user?.name}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
