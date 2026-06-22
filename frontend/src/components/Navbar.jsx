import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Search, Menu, Settings } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/institutions') return 'Institutions';
    if (path === '/contracts') return 'Contracts';
    if (path === '/contracts/new') return 'Create Contract';
    if (path.includes('/contracts/') && path.includes('/edit')) return 'Edit Contract';
    if (path.startsWith('/contracts/')) return 'Contract Details';
    if (path === '/routes') return 'Routes';
    if (path === '/vehicles') return 'Vehicles';
    if (path === '/payments') return 'Payments';
    if (path === '/alerts') return 'Alerts';
    if (path === '/reports') return 'Reports';
    if (path === '/audit-logs') return 'Audit Logs';
    if (path === '/settings') return 'Settings';
    return 'Transport Management';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-[#080B14]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-2xl text-[#94A3B8] hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {getPageTitle()}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#94A3B8] font-medium mt-0.5">
            <span>Manivtha Tours & Travels</span>
            <span className="text-white/10 font-normal">|</span>
            <span className="capitalize text-[#A78BFA]">{user?.role?.toLowerCase() || 'Viewer'} Panel</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Mock (like the mock header search) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#121827] border border-white/5 rounded-2xl text-xs text-[#94A3B8] focus-within:border-[#8B7CFF]/50 transition-all duration-200">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search contracts..."
            className="bg-transparent border-none outline-none text-white w-48 placeholder-[#94A3B8]/60"
          />
        </div>

        {/* Quick action notification element */}
        <button className="p-2.5 rounded-2xl text-[#94A3B8] bg-[#121827] hover:bg-white/5 hover:text-white border border-white/5 transition-all cursor-pointer relative shadow-inner">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8B7CFF] border border-[#080B14] shadow-sm animate-pulse" />
        </button>

        {/* Quick settings element (mimicking the mock settings) */}
        <Link to="/settings" className="p-2.5 rounded-2xl text-[#94A3B8] bg-[#121827] hover:bg-white/5 hover:text-white border border-white/5 transition-all cursor-pointer relative shadow-inner">
          <Settings className="w-4.5 h-4.5" />
        </Link>

        {/* User Card */}
        <Link to="/settings" className="flex items-center gap-3 p-1.5 bg-[#121827] border border-white/5 rounded-2xl hover:bg-white/5 hover:shadow-lg hover:shadow-[#8B7CFF]/5 transition-all duration-250 cursor-pointer group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B7CFF] to-[#A78BFA] text-white flex items-center justify-center text-sm font-bold shadow-md shadow-[#8B7CFF]/20 group-hover:scale-102 transition-transform duration-200">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden md:block pr-3">
            <p className="text-xs font-bold text-white leading-tight">{user?.full_name || 'User'}</p>
            <p className="text-[9px] text-[#A78BFA] font-bold uppercase tracking-wider mt-0.5 leading-none">{user?.role || 'VIEWER'}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

