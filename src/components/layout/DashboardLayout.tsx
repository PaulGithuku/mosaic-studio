import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StudioPreviewModal } from '../dashboard/StudioPreviewModal';
import {
  LayoutDashboard,
  CalendarCheck2,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  User,
  Settings,
  LogOut,
  Camera,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  Smartphone,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  isImplemented: boolean;
  phaseLabel?: string;
}

export const DashboardLayout: React.FC = () => {
  const { currentUser, photographer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems: SidebarItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      isImplemented: true,
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: <User className="w-4 h-4" />,
      isImplemented: true,
    },
    {
      name: 'Portfolio',
      href: '/dashboard/portfolio',
      icon: <ImageIcon className="w-4 h-4" />,
      isImplemented: true,
    },
    {
      name: 'Services',
      href: '/dashboard/services',
      icon: <Sparkles className="w-4 h-4" />,
      isImplemented: true,
    },
    {
      name: 'Availability',
      href: '/dashboard/calendar',
      icon: <Calendar className="w-4 h-4" />,
      isImplemented: true,
    },
    {
      name: 'Bookings',
      href: '/dashboard/bookings',
      icon: <CalendarCheck2 className="w-4 h-4" />,
      isImplemented: true,
    },
  ];

  // Dynamic breadcrumb title
  const currentNavItem = navItems.find((item) => item.href === location.pathname);
  const pageTitle = currentNavItem ? currentNavItem.name : 'Studio';

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F7F5F0] flex flex-col font-sans selection:bg-[#C9A86A] selection:text-[#0B0B0B]">
      {/* Top Mobile Bar */}
      <header className="lg:hidden h-16 border-b border-[#222222] bg-[#0E0E0E] px-4 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-[#161616] border border-[#333333] flex items-center justify-center text-[#C9A86A]">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <span className="font-serif text-base tracking-wider font-semibold text-[#F7F5F0]">
            MOSAIC
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {photographer?.slug && (
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="p-2 text-[#C9A86A] hover:bg-[#181818] rounded-sm"
              title="Preview Studio Profile"
              aria-label="Preview Studio Profile"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="p-2 text-[#A0A0A0] hover:text-[#F7F5F0]"
            aria-label="Toggle navigation drawer"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-[#0D0D0D] border-r border-[#1F1F1F] shrink-0 justify-between">
          <div>
            {/* Studio Header */}
            <div className="p-6 border-b border-[#1A1A1A]">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-[#161616] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A]">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-lg tracking-wider font-bold text-[#F7F5F0] leading-tight">
                    MOSAIC
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A86A] font-medium">
                    Studio Platform
                  </span>
                </div>
              </Link>

              {/* Photographer mini-badge */}
              <div className="mt-5 p-3 rounded-sm bg-[#141414] border border-[#222222]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border border-[#333333] overflow-hidden flex items-center justify-center text-[#C9A86A] text-xs font-semibold shrink-0">
                    {photographer?.profile_image_path ? (
                      <img
                        src={photographer.profile_image_path}
                        alt={photographer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser?.name?.charAt(0) || 'P'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#F7F5F0] truncate">
                      {photographer?.name || currentUser?.name}
                    </p>
                    <p className="text-[10px] font-mono text-[#888888] truncate">
                      @{photographer?.slug || 'photographer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation items */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <NavLink
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive: active }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-sm text-xs font-medium transition-all ${
                        active
                          ? 'bg-[#181818] text-[#F7F5F0] border-l-2 border-[#C9A86A] font-semibold pl-3'
                          : 'text-[#A0A0A0] hover:text-[#F7F5F0] hover:bg-[#141414]'
                      }`
                    }
                  >
                    {({ isActive: active }) => (
                      <div className="flex items-center gap-3">
                        <span className={active ? 'text-[#C9A86A]' : 'text-[#6F6F6F]'}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                    )}
                  </NavLink>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer Area */}
          <div className="p-4 border-t border-[#1A1A1A] space-y-2">
            {photographer?.slug && (
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#161616] hover:bg-[#1E1E1E] border border-[#282828] rounded-sm text-xs font-mono text-[#C9A86A] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Preview Studio</span>
                </div>
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#666666] flex items-center justify-between">
              <span>Phase 5 System</span>
              <span className="text-emerald-400 font-medium">Production Ready</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs text-[#A0A0A0] hover:text-red-400 hover:bg-[#1A1111] transition-all"
            >
              <LogOut className="w-4 h-4 text-red-400/70" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-[#0B0B0B]/90 backdrop-blur-sm flex">
            <div className="w-4/5 max-w-xs bg-[#0E0E0E] h-full p-6 flex flex-col justify-between border-r border-[#222222]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#C9A86A]" />
                    <span className="font-serif text-lg font-bold text-[#F7F5F0]">MOSAIC</span>
                  </div>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1 text-[#6F6F6F] hover:text-[#F7F5F0]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-4 p-3 bg-[#161616] rounded border border-[#262626]">
                  <p className="text-xs font-semibold text-[#F7F5F0]">
                    {photographer?.name || currentUser?.name}
                  </p>
                  <p className="text-[10px] font-mono text-[#A0A0A0]">@{photographer?.slug}</p>
                </div>

                <nav className="space-y-1.5 mt-4">
                  {navItems.map((item) => (
                    <div key={item.name}>
                      <NavLink
                        to={item.href}
                        end={item.href === '/dashboard'}
                        onClick={() => setMobileNavOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded text-sm ${
                            isActive ? 'text-[#C9A86A] bg-[#181818] font-semibold' : 'text-[#A0A0A0]'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                      </NavLink>
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#222222] space-y-2">
                {photographer?.slug && (
                  <button
                    onClick={() => {
                      setMobileNavOpen(false);
                      setPreviewModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-[#C9A86A] bg-[#161616] border border-[#2A2A2A] rounded-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Studio Preview</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#0B0B0B]">
          {/* Top Bar for Desktop */}
          <div className="hidden lg:flex h-16 border-b border-[#1E1E1E] bg-[#0E0E0E]/60 backdrop-blur px-8 items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-[#6F6F6F]">
              <Link to="/dashboard" className="hover:text-[#F7F5F0] transition-colors">
                Studio
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#F7F5F0] font-medium">{pageTitle}</span>
            </div>

            <div className="flex items-center gap-3">
              {photographer?.slug && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] hover:bg-[#202020] text-[#D0D0D0] hover:text-[#F7F5F0] text-xs font-mono uppercase tracking-wider border border-[#2E2E2E] rounded-sm transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A86A]" />
                    <span>Preview Frame</span>
                  </button>

                  <a
                    href={`/p/${photographer.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Live Public Page</span>
                  </a>
                </>
              )}

              <div className="h-4 w-px bg-[#262626]" />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-[#F7F5F0]">
                    {photographer?.name || currentUser?.name}
                  </p>
                  <p className="text-[10px] font-mono text-[#888888]">{currentUser?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#2E2E2E] overflow-hidden flex items-center justify-center text-xs font-semibold text-[#C9A86A]">
                  {photographer?.profile_image_path ? (
                    <img
                      src={photographer.profile_image_path}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser?.name?.charAt(0) || 'P'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Studio Preview Modal */}
      {photographer?.slug && (
        <StudioPreviewModal
          slug={photographer.slug}
          photographerName={photographer.name || currentUser?.name}
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}
    </div>
  );
};
