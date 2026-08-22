import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  MapPin,
  Calendar,
  Sparkles,
  Users,
  Plus,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './Button';
import { InitialsAvatar } from './InitialsAvatar';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Compass },
    { name: 'My Trips', path: '/trips', icon: Calendar },
    { name: 'Explore Cities', path: '/explore/cities', icon: MapPin },
    { name: 'Activities', path: '/explore/activities', icon: Sparkles },
    { name: 'Community', path: '/community', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F7F6]/95 backdrop-blur-md border-b border-[#E5E1E4] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="GlobeTrotter"
                className="w-10 h-10 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform duration-200"
              />
              <div>
                <span className="text-xl font-display font-black tracking-tight text-[#2F2930]">
                  Globe<span className="text-[#714B67]">Trotter</span>
                </span>
                <span className="hidden lg:block text-[9px] text-[#6F6A70] font-bold tracking-wider uppercase -mt-1">
                  Plan smarter. Travel better.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E1E4]">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                        active
                          ? 'bg-[#F4EEF3] text-[#714B67] shadow-2xs border border-[#E5E1E4]'
                          : 'text-[#6F6A70] hover:text-[#2F2930] hover:bg-[#F7F7F6]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#714B67]' : 'text-[#6F6A70]'}`} />
                      {link.name}
                    </Link>
                  );
                })}
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                      isActive('/admin')
                        ? 'bg-[#714B67] text-white shadow-2xs'
                        : 'text-[#714B67] hover:bg-[#F4EEF3]'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#017E84] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#017E84]"></span>
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/trips/new')}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="hidden sm:inline-flex"
                >
                  Plan Trip
                </Button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-[#E5E1E4] transition-all cursor-pointer"
                  >
                    <InitialsAvatar
                      name={user?.name || 'User'}
                      avatar={user?.avatar}
                      size="sm"
                    />
                    <span className="hidden sm:block text-xs font-bold text-[#2F2930]">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6F6A70]" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E5E1E4] shadow-dropdown py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-[#E5E1E4]">
                        <p className="text-xs font-bold text-[#2F2930] truncate font-display">{user?.name}</p>
                        <p className="text-[11px] text-[#6F6A70] truncate">{user?.email}</p>
                        {user?.role === 'ADMIN' && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-[#714B67] bg-[#F4EEF3] px-2 py-0.5 rounded border border-[#E5E1E4]">
                            Administrator
                          </span>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#6F6A70] hover:text-[#2F2930] hover:bg-[#F7F7F6]"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-[#6F6A70]" />
                          Profile & Settings
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#6F6A70] hover:text-[#2F2930] hover:bg-[#F7F7F6]"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#714B67]" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#E5E1E4] pt-1">
                        <button
                          onClick={() => {
                            logout();
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#B85C5C] hover:bg-[#F9EFEF] cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-[#6F6A70] hover:bg-white border border-[#E5E1E4]"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden py-4 border-t border-[#E5E1E4] space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                    active
                      ? 'bg-[#F4EEF3] text-[#714B67] border border-[#E5E1E4]'
                      : 'text-[#6F6A70] hover:bg-white hover:text-[#2F2930]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[#714B67] bg-[#F4EEF3] border border-[#E5E1E4]"
              >
                <ShieldCheck className="w-4 h-4 text-[#714B67]" />
                Admin Console
              </Link>
            )}
            <div className="pt-2 px-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/trips/new');
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Plan New Trip
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
