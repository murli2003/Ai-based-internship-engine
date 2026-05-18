import React, { createContext, useContext } from 'react';
import { useStudentDashboard } from '../hooks/useStudentDashboard';

const StudentDataContext = createContext(null);

export function StudentDataProvider({ children }) {
  const data = useStudentDashboard();
  return (
    <StudentDataContext.Provider value={data}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error('useStudentData must be used within StudentDataProvider');
  return ctx;
}
