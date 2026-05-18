import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import StudentDashboard from "./pages/StudentDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboardEnhanced from "./pages/AdminDashboardEnhanced";

// Student sub-pages
import Overview           from "./pages/student/Overview";
import Matches            from "./pages/student/Matches";
import Applications       from "./pages/student/Applications";
import Skills             from "./pages/student/Skills";
import Profile            from "./pages/student/Profile";
import InternshipDetail   from "./pages/student/InternshipDetail";

// Provider sub-pages
import ProviderOverview       from "./pages/provider/Overview";
import ProviderPostings       from "./pages/provider/Postings";
import ProviderPipeline       from "./pages/provider/Pipeline";
import ProviderAnalytics      from "./pages/provider/Analytics";
import ProviderCompanyProfile from "./pages/provider/CompanyProfile";
import PostingForm            from "./pages/provider/PostingForm";

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === "student") return <Navigate to="/app/dashboard" replace />;
  if (user?.role === "provider" || user?.role === "organization") return <Navigate to="/app/provider" replace />;
  if (user?.role === "admin") return <Navigate to="/app/admin" replace />;
  return <Navigate to="/app/dashboard" replace />;
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* App shell */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />

        {/* ── Student dashboard (multi-page) ── */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        >
          <Route index        element={<Overview />}     />
          <Route path="matches"                    element={<Matches />}           />
          <Route path="applications"               element={<Applications />}      />
          <Route path="skills"                     element={<Skills />}            />
          <Route path="profile"                    element={<Profile />}           />
          <Route path="internship/:id"             element={<InternshipDetail />}  />
        </Route>

        {/* ── Provider dashboard (multi-page) ── */}
        <Route
          path="provider"
          element={
            <ProtectedRoute roles={["provider", "organization"]}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        >
          <Route index                          element={<ProviderOverview />}       />
          <Route path="postings"              element={<ProviderPostings />}       />
          <Route path="postings/new"          element={<PostingForm />}            />
          <Route path="postings/:id/edit"     element={<PostingForm />}            />
          <Route path="pipeline"              element={<ProviderPipeline />}       />
          <Route path="analytics"             element={<ProviderAnalytics />}      />
          <Route path="profile"               element={<ProviderCompanyProfile />} />
        </Route>

        {/* ── Admin dashboard ── */}
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardEnhanced />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Legacy redirects */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/provider"  element={<Navigate to="/app/provider"  replace />} />
      <Route path="/admin"     element={<Navigate to="/app/admin"     replace />} />
      <Route path="*"          element={<Navigate to="/"              replace />} />
    </Routes>
  );
}
