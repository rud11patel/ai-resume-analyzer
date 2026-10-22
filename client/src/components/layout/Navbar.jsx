import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  LayoutDashboard, 
  History, 
  Settings, 
  UploadCloud, 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  User, 
  ChevronDown
} from 'lucide-react';
import { useMockAuth } from '../../hooks/useMockAuth';
import { ApiHealthBadge } from '../ui/ApiHealthBadge';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useMockAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Analyze', path: '/analyze', icon: UploadCloud },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'History', path: '/history', icon: History },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E222D] bg-[#090A0E]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-xs transition-colors group-hover:border-zinc-500">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-zinc-100">
                  ResumeAI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                  Engine
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/70 font-semibold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Live Backend Connection Indicator */}
            <ApiHealthBadge />

            {/* User Profile or Login CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-[#111318] hover:bg-[#16181F] border border-[#232734] transition-colors text-left cursor-pointer"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-[11px] font-semibold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-medium text-zinc-200 leading-none truncate max-w-[120px]">
                      {user.name}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111318] border border-[#262A37] shadow-xl py-1 z-20 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3.5 py-2.5 border-b border-[#232734]">
                        <p className="font-semibold text-zinc-100 truncate">{user.name}</p>
                        <p className="text-zinc-400 truncate text-[11px] mt-0.5">{user.email}</p>
                      </div>
                      
                      <Link
                        to="/analyze"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
                        <span>New Analysis</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                      >
                        <History className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Analysis History</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-[#232734] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/analyze"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#1E222D] space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
