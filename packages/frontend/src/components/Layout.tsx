import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../api/auth';

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-200',
  EDITOR: 'bg-amber-500/20 text-amber-200',
  VIEWER: 'bg-white/20 text-white/70',
};

export default function Layout() {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/releases', label: 'Releases' },
    { to: '/search', label: 'Search' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin/users', label: 'Users' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold tracking-tight">NRMS</h1>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">{user.displayName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadgeColors[user.role] ?? ''}`}>
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
