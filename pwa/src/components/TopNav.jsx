import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Flame, LogOut } from 'lucide-react';

export function TopNav() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/activities', label: 'Activities' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/profile', label: 'Profile' }
  ];

  return (
    <header className="sticky top-0 bg-white shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FICC Connect</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label }) => {
              const isActive = location.pathname === path ||
                (path !== '/' && location.pathname.startsWith(path));

              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.nickname}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                      {user?.nickname?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {user?.nickname}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
