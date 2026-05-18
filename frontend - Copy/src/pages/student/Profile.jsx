import React from 'react';
import { User } from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import StudentProfileAdvanced from '../../components/StudentProfileAdvanced';
import PageHeader from '../../components/PageHeader';

export default function Profile() {
  const { profile, updateProfile } = useStudentData();
  const { user } = useAuth();

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageHeader
        icon={User}
        title="My Profile"
        subtitle="Resume-backed sections, skills, and contact — all used for AI match scoring"
      />
      <StudentProfileAdvanced
        profile={profile}
        userEmail={user?.email}
        onSave={updateProfile}
      />
    </div>
  );
}
