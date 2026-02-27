import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useAuthInit } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-accent-600 border-t-transparent" />
      </div>
    );
  }

  // 프로필이 없고 세션도 없으면 로그인으로
  if (!profile && !hasSession) {
    return <Navigate to="/login" replace />;
  }

  // 프로필이 없지만 세션이 있으면 (프로필 로딩 중) 스피너 표시
  if (!profile && hasSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();

  if (!isLoading && profile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  // App 레벨에서 한 번만 인증 초기화
  useAuthInit();

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board/:boardId"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
