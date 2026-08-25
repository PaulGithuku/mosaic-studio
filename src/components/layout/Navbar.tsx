import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, LogOut, LayoutDashboard, Menu, X, User } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0B0B]/90 backdrop-blur-md border-b border-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-sm bg-[#161616] border border-[#333333] flex items-center justify-center text-[#C9A86A] group-hover:border-[#C9A86A] transition-colors">
            <Camera className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg tracking-wider text-[#F7F5F0] font-semibold leading-tight">
              MOSAIC
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#A0A0A0] leading-none">
              Studio
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-xs uppercase tracking-widest transition-colors ${
              location.pathname === '/' ? 'text-[#C9A86A]' : 'text-[#A0A0A0] hover:text-[#F7F5F0]'
            }`}
          >
            Overview
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                >
                  Photographer Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-[#262626]">
                <div className="w-7 h-7 rounded-full bg-[#181818] border border-[#333333] flex items-center justify-center text-xs text-[#C9A86A]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[#F7F5F0] max-w-[120px] truncate font-medium">
                  {currentUser?.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-[#6F6F6F] hover:text-red-400 transition-colors ml-1"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !isAuthPage ? (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="champagne" size="sm">
                  Join As Photographer
                </Button>
              </Link>
            </div>
          ) : null}
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-[#A0A0A0] hover:text-[#F7F5F0] focus:outline-none"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#222222] bg-[#0E0E0E] px-4 pt-3 pb-5 flex flex-col gap-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm py-2 text-[#F7F5F0] border-b border-[#1A1A1A]"
          >
            Overview
          </Link>
          {isAuthenticated ? (
            <>
              <div className="py-2 text-xs text-[#A0A0A0] flex items-center justify-between">
                <span>Signed in as <strong className="text-[#F7F5F0]">{currentUser?.name}</strong></span>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="champagne" size="sm" className="w-full justify-center">
                  Photographer Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full justify-center"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="champagne" size="sm" className="w-full justify-center">
                  Join As Photographer
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
