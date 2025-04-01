import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Events } from "./pages/Events";
import { EventDetails } from "./pages/EventDetails";
import { RedemptionPage } from "./pages/RedemptionPage";
import { Promotions } from "./pages/Promotions";
import { useState, useEffect } from "react";
import { api } from "./lib/api/fetchWrapper";
import { UserProvider } from "./contexts/UserContext";
import { Users } from "./pages/Users";

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
      console.error("Error checking auth:", error);
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
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {user && <Navbar user={user} onLogout={handleLogout} />}
          <main>
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  user ? <Dashboard /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/transactions"
                element={
                  user ? <Transactions /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/events"
                element={user ? <Events /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/events/:eventId"
                element={
                  user ? <EventDetails /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/promotions"
                element={
                  user ? <Promotions /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/users"
                element={
                  user ? <Users /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/redeem"
                element={
                  user ? <RedemptionPage /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/login"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
