'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DrawdownHeader from '@/components/layout/DrawdownHeader';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setTimeout(() => setIsCollapsed(true), 0);
    }
    setTimeout(() => setMounted(true), 0);

    const checkAuth = async () => {
      if (pathname === '/login' || pathname === '/register') {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
          localStorage.setItem('maven_logged_in', 'true');
          localStorage.setItem('user_name', data.user.name);
          localStorage.setItem('user_email', data.user.email);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('maven_logged_in');
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleToggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  // Skip rendering sidebar and header for login and register pages
  if (pathname === '/login' || pathname === '/register') {
    return <div className="min-h-screen w-full bg-[#070709] text-white">{children}</div>;
  }

  // Show a loading screen if checking authentication state
  if (authLoading && pathname !== '/login' && pathname !== '/register') {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Validating security context...</span>
        </div>
      </div>
    );
  }

  // Show a redirect screen if not authenticated
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  // Avoid hydrations mismatch on first render
  const sidebarWidth = isCollapsed ? 'md:ml-[70px]' : 'md:ml-[240px]';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex">
      {/* Skip to Main Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isCollapsed={mounted ? isCollapsed : false}
        onToggle={handleToggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`min-h-screen flex-1 flex flex-col transition-all duration-300 ml-0 ${
          mounted ? sidebarWidth : 'md:ml-[240px]'
        }`}
      >
        {/* Drawdown Header */}
        <DrawdownHeader onMenuClick={() => setIsMobileOpen(true)} />

        {/* Page Content */}
        <main id="main-content" className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
