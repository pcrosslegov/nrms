import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './api/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReleasesPage from './pages/ReleasesPage';
import ReleaseEditPage from './pages/ReleaseEditPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/releases/:id" element={<ReleaseEditPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
