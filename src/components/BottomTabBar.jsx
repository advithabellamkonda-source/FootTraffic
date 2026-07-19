import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Instagram, Users, Star, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/posts', label: 'Posts', icon: Instagram },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomTabBar() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors',
                isActive ? 'text-[#2f5d45]' : 'text-stone-400'
              )
            }
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}