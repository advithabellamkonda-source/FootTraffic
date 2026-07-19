import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home as HomeIcon, Instagram, Users, Tag, Star, BarChart3, Building2, Menu, X, Flower2, Sparkles, Mail, CreditCard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import BottomTabBar from '@/components/BottomTabBar';
import PullToRefresh from '@/components/PullToRefresh';
import PageTransition from '@/components/PageTransition';

const navItems = [
{ to: '/', label: 'Home', icon: HomeIcon, end: true },
{ to: '/posts', label: 'Social Posts', icon: Instagram },
{ to: '/customers', label: 'Customers', icon: Users },
{ to: '/promotions', label: 'Promotions', icon: Tag },
{ to: '/reviews', label: 'Reviews', icon: Star },
{ to: '/analytics', label: 'Analytics', icon: BarChart3 },
{ to: '/partnerships', label: 'Partnerships', icon: Building2 },
{ to: '/newsletters', label: 'Newsletters', icon: Mail },
{ to: '/pricing', label: 'Plans', icon: CreditCard }];


function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2f5d45] to-[#1c3a2b] flex items-center justify-center shadow-sm">
          <Flower2 className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <p className="font-display font-semibold text-stone-900 text-base leading-tight" style={{ fontVariationSettings: "'opsz' 16" }}>Moody Café</p>
          <p className="text-[11px] text-stone-400 leading-tight">Rice University</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) =>
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            isActive ? 'bg-[#e8f0ea] text-[#2f5d45]' : 'text-stone-600 hover:bg-stone-100'
          )
          }>
          
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        )}
      </nav>

      <div className="p-3 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">Starter Plan</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
            Upgrade for unlimited AI posts and advanced analytics.
          </p>
          <Button asChild size="sm" className="w-full bg-white text-stone-900 hover:bg-stone-100 text-xs h-8 font-semibold">
            <Link to="/pricing">Upgrade Plan</Link>
          </Button>
        </div>
        <button
          onClick={() => {logout();onNavigate?.();}}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">
          
          <LogOut className="w-[18px] h-[18px]" />
          <span className="truncate">{user?.email ? `Log out (${user.email})` : 'Log out'}</span>
        </button>
      </div>
    </div>);

}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-stone-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {mobileOpen &&
      <>
          <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)} />
        
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden">
            <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-100">
            
              <X className="w-5 h-5 text-stone-500" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      }

      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="lg:hidden sticky top-0 bg-white border-b border-stone-200 px-4 flex items-center justify-between z-20 safe-area-top" style={{ minHeight: '3.5rem' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex items-center gap-2">
            <Flower2 className="w-5 h-5 text-[#2f5d45]" />
            <span className="font-display font-semibold text-stone-900 text-[15px]" style={{ fontVariationSettings: "'opsz' 16" }}>Moody Café</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <PullToRefresh onRefresh={() => {window.dispatchEvent(new CustomEvent('pulltorefresh'));return new Promise((res) => setTimeout(res, 800));}}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </PullToRefresh>
        </main>
        <BottomTabBar />
      </div>
    </div>);

}