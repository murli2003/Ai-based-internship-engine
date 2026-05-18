import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const PATH_LABELS = {
  '/app/dashboard':              { label: 'Overview',           parent: null },
  '/app/dashboard/matches':      { label: 'AI Matches',         parent: '/app/dashboard' },
  '/app/dashboard/applications': { label: 'Applications',       parent: '/app/dashboard' },
  '/app/dashboard/skills':       { label: 'Skills & Analytics', parent: '/app/dashboard' },
  '/app/dashboard/profile':      { label: 'My Profile',         parent: '/app/dashboard' },
};

export default function PageHeader({ icon: Icon, title, subtitle, badge, actions }) {
  const { pathname } = useLocation();
  const meta   = PATH_LABELS[pathname];
  const parent = meta?.parent;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
    >
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-surface-400 mb-3">
          <Link to="/app/dashboard" className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <Home className="h-3 w-3" /> Dashboard
          </Link>
          {parent && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={parent} className="hover:text-primary-600 transition-colors">Overview</Link>
            </>
          )}
          {meta && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-surface-600">{meta.label}</span>
            </>
          )}
        </nav>

        {/* Title row */}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-primary-100 border border-primary-200 shrink-0">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-surface-900 tracking-tight">{title}</h1>
              {badge != null && (
                <span className="rounded-full bg-primary-100 text-primary-700 text-[11px] font-bold px-2.5 py-0.5">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-surface-500 mt-0.5 max-w-xl sm:max-w-none">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
