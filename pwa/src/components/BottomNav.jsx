import { Home, Activity, Image, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/activities', icon: Activity, label: 'Activities' },
    { path: '/gallery', icon: Image, label: 'Gallery' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
