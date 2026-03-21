import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useIsMobile } from './hooks/useMediaQuery';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPrompt } from './components/InstallPrompt';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Activities } from './pages/Activities';
import { Gallery } from './pages/Gallery';
import { Profile } from './pages/Profile';
import { ActivityDetail } from './pages/ActivityDetail';
import { ActivityGallery } from './pages/ActivityGallery';
import { Checkin } from './pages/Checkin';
import { CreateActivity } from './pages/CreateActivity';
import { Leaderboard } from './pages/Leaderboard';

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Layout component
function Layout({ children }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      {isMobile ? <BottomNav /> : <TopNav />}
      <main className={`${isMobile ? 'pb-20' : 'pt-16'}`}>
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <Layout>
              <Activities />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/new"
        element={
          <ProtectedRoute>
            <CreateActivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/:id"
        element={
          <ProtectedRoute>
            <ActivityDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin/:id"
        element={
          <ProtectedRoute>
            <Checkin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <Layout>
              <Gallery />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery/:id"
        element={
          <ProtectedRoute>
            <ActivityGallery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard/:id"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
