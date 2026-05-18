import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { StudentDataProvider } from '../context/StudentDataContext';
import ResumeOnboardingModal from '../components/ResumeOnboardingModal';

/**
 * StudentDashboard — thin wrapper that:
 * 1. Provides shared data context (StudentDataProvider)
 * 2. Shows onboarding modal until profileCompleted
 * 3. Renders <Outlet /> (child page route)
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student' && !user.profileCompleted) {
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, [user]);

  return (
    <StudentDataProvider>
      <AnimatePresence>
        {showOnboarding && (
          <ResumeOnboardingModal
            onComplete={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        key="student-content"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <Outlet />
      </motion.div>
    </StudentDataProvider>
  );
}
