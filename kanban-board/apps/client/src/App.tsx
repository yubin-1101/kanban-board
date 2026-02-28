import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, useAuthInit } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';

function AuthGate() {
  const { profile, isLoading } = useAuth();

  // 인증 상태 확인 중이면 스피너
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-accent-600 border-t-transparent" />
      </div>
    );
  }

  // 인증 안 됨 → 로그인
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // 인증 됨 → 자식 라우트 렌더
  return <Outlet />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();

  // 로딩 중이면 스피너 (깜빡임 방지)
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-accent-600 border-t-transparent" />
      </div>
    );
  }

  // 이미 로그인 됨 → 대시보드로
  if (profile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<AuthGate />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
