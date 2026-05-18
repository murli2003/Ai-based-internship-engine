import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Briefcase, FileText, LogOut, Menu, X,
  Bell, Search, User, TrendingUp, Award, ChevronLeft, ChevronRight,
  Settings, Zap, BarChart2, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Nav config — all items now use real `to` routes ─────────── */
const NAV_CONFIG = {
  student: [
    { label: 'Overview',           icon: LayoutDashboard, to: '/app/dashboard'              },
    { label: 'AI Matches',         icon: Sparkles,        to: '/app/dashboard/matches'      },
    { label: 'Applications',       icon: FileText,        to: '/app/dashboard/applications' },
    { label: 'Skills & Analytics', icon: BarChart2,       to: '/app/dashboard/skills'       },
    { label: 'My Profile',         icon: User,            to: '/app/dashboard/profile'      },
  ],
  provider: [
    { label: 'Overview',           icon: LayoutDashboard, to: '/app/provider'            },
    { label: 'Internships',        icon: Briefcase,       to: '/app/provider/postings'   },
    { label: 'Candidate Pipeline', icon: Users,           to: '/app/provider/pipeline'   },
    { label: 'Analytics',          icon: BarChart2,       to: '/app/provider/analytics'  },
    { label: 'Company Profile',    icon: Settings,        to: '/app/provider/profile'    },
  ],
  organization: [
    { label: 'Overview',           icon: LayoutDashboard, to: '/app/provider'            },
    { label: 'Internships',        icon: Briefcase,       to: '/app/provider/postings'   },
    { label: 'Candidate Pipeline', icon: Users,           to: '/app/provider/pipeline'   },
    { label: 'Analytics',          icon: BarChart2,       to: '/app/provider/analytics'  },
    { label: 'Company Profile',    icon: Settings,        to: '/app/provider/profile'    },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/app/admin' },
    { label: 'Students',  icon: Users,           to: '/app/admin' },
    { label: 'Providers', icon: Briefcase,       to: '/app/admin' },
    { label: 'Analytics', icon: TrendingUp,      to: '/app/admin' },
    { label: 'Reports',   icon: FileText,        to: '/app/admin' },
  ],
};

const ROLE_META = {
  student:      { color: 'text-primary-600',   bg: 'bg-primary-600',   label: 'Student',      gradient: 'from-primary-500 to-secondary-500'  },
  provider:     { color: 'text-secondary-600', bg: 'bg-secondary-600', label: 'Organization', gradient: 'from-secondary-500 to-primary-500'   },
  organization: { color: 'text-secondary-600', bg: 'bg-secondary-600', label: 'Organization', gradient: 'from-secondary-500 to-primary-500'   },
  admin:        { color: 'text-accent-600',    bg: 'bg-accent-600',    label: 'Admin',        gradient: 'from-accent-500 to-warning-500'      },
};

/* ─── Avatar ───────────────────────────────────────────────────── */
function Avatar({ name, role, size = 'md' }) {
  const sz = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' }[size];
  const grad = ROLE_META[role]?.gradient || 'from-primary-500 to-secondary-500';
  const char = (name || '?').charAt(0).toUpperCase();
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0 shadow-soft`}>
      {char}
    </div>
  );
}

/* ─── Sidebar nav item ─────────────────────────────────────────── */
function NavItem({ item, collapsed, onClick, isMultiPage }) {
  const Icon = item.icon;
  const location = useLocation();

  // Index routes use exact match; nested routes use prefix match
  const indexRoutes = ['/app/dashboard', '/app/provider'];
  const isActive = isMultiPage
    ? indexRoutes.includes(item.to)
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
    : location.pathname === item.to;

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center' : ''} ${
        isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item'
      }`}
    >
      <Icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-surface-400'}`} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />}
        </>
      )}
    </NavLink>
  );
}

/* ─── Sidebar content ──────────────────────────────────────────── */
function SidebarContent({ collapsed, role, navItems, onNavClick, displayName, email, onLogout }) {
  const isMultiPage = role === 'student' || role === 'provider' || role === 'organization';

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex h-16 items-center border-b border-surface-200 ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
        {!collapsed ? (
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-soft">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-extrabold text-surface-900 tracking-tight">InternMatch</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mt-0.5">AI Platform</p>
            </div>
          </NavLink>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-soft">
            <Award className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-0.5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-surface-400">Menu</p>
        )}
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} onClick={onNavClick} isMultiPage={isMultiPage} />
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-surface-200 p-3 space-y-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 border border-surface-200 px-3 py-2.5">
            <Avatar name={email} role={role} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-surface-900 truncate">{displayName}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${ROLE_META[role]?.color || 'text-primary-600'}`}>
                {ROLE_META[role]?.label || role}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-1">
            <Avatar name={email} role={role} size="sm" />
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger-600 transition-all duration-150 hover:bg-danger-50 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

/* ─── Layout ───────────────────────────────────────────────────── */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role        = user?.role || 'student';
  const navItems    = NAV_CONFIG[role] || [];
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';

  const handleLogout = () => { logout(); navigate('/login'); };

  // Determine page title from current path
  const pageTitles = {
    '/app/dashboard':              'Overview',
    '/app/dashboard/matches':      'AI Matches',
    '/app/dashboard/applications': 'Applications',
    '/app/dashboard/skills':       'Skills & Analytics',
    '/app/dashboard/profile':      'My Profile',
    '/app/provider':               'Overview',
    '/app/provider/postings':      'Internship Postings',
    '/app/provider/pipeline':      'Candidate Pipeline',
    '/app/provider/analytics':     'Analytics',
    '/app/provider/profile':       'Company Profile',
    '/app/admin':                  'Admin Dashboard',
  };
  // Dynamic title for internship detail pages
  const internshipDetailMatch = location.pathname.match(/^\/app\/dashboard\/internship\//);
  const postingFormNewMatch   = location.pathname === '/app/provider/postings/new';
  const postingFormEditMatch  = location.pathname.match(/^\/app\/provider\/postings\/.+\/edit$/);

  const pageTitle = pageTitles[location.pathname]
    || (internshipDetailMatch ? 'Internship Details' : null)
    || (postingFormNewMatch   ? 'New Internship Posting' : null)
    || (postingFormEditMatch  ? 'Edit Internship Posting' : null)
    || 'Dashboard';

  const sidebarProps = {
    role,
    navItems,
    displayName,
    email: user?.email,
    onNavClick: () => setMobileMenuOpen(false),
    onLogout: handleLogout,
  };

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-surface-200 bg-white shadow-card transition-all duration-300 hidden lg:block ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}
      >
        <SidebarContent {...sidebarProps} collapsed={!sidebarOpen} />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute -right-3.5 top-20 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-surface-200 bg-white shadow-soft hover:border-primary-300 hover:shadow-glow-sm transition-all"
        >
          {sidebarOpen
            ? <ChevronLeft  className="h-3.5 w-3.5 text-surface-400" />
            : <ChevronRight className="h-3.5 w-3.5 text-surface-400" />
          }
        </button>
      </aside>

      {/* ── Mobile sidebar ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-surface-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-surface-200 bg-white shadow-elevated lg:hidden"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent {...sidebarProps} collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>

        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-surface-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Current page pill */}
            <div className="hidden md:flex items-center gap-2 text-xs text-surface-500">
              <span className="font-semibold text-surface-700">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search hint */}
            <button className="hidden sm:flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-400 hover:border-primary-300 hover:text-surface-600 transition-all">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Search…</span>
              <kbd className="hidden md:inline rounded border border-surface-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-surface-400">⌘K</kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors">
                <Bell size={18} />
              </button>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white" />
            </div>

            {/* Role badge */}
            <div className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
              role === 'student'
                ? 'border-primary-200 bg-primary-50 text-primary-700'
                : role === 'admin'
                ? 'border-accent-200 bg-accent-50 text-accent-700'
                : 'border-secondary-200 bg-secondary-50 text-secondary-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${ROLE_META[role]?.bg || 'bg-primary-500'}`} />
              {ROLE_META[role]?.label || role}
            </div>

            {/* Avatar */}
            <div className="hidden lg:block">
              <Avatar name={user?.email} role={role} size="sm" />
            </div>
          </div>
        </header>

        {/* Page — profile uses full content width; other pages stay in max-w-7xl */}
        <main className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
          <div
            className={`mx-auto w-full min-w-0 ${
              location.pathname.includes('/dashboard/profile') || location.pathname.includes('/provider/profile')
                ? 'max-w-[min(100%,1600px)]'
                : 'max-w-7xl'
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
