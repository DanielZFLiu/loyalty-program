import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Points } from './pages/Points';
import { Transactions } from './pages/Transactions';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { useState, useEffect } from 'react';
import { api } from './lib/api';

interface User {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser({
        id: data.id,
        name: data.name,
        role: data.role,
        avatarUrl: data.avatarUrl,
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/points" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/points"
              element={user ? <Points /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/transactions"
              element={user ? <Transactions /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile"
              element={user ? <Profile /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/points" replace />
                ) : (
                  <Login />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;