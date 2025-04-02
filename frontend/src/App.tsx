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
import { useUser } from "./contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CashierDashboard from "./pages/cashier/CashierDashboard.tsx";
import CashierTransaction from "./pages/cashier/CashierTransaction.tsx";
import CashierRedemption from "./pages/cashier/CashierRedemption.tsx";
import { Users } from "./pages/Users";
import { UserDetails } from "./pages/UserDetails";
import { TransactionDetails } from "./pages/TransactionDetails";
import { PromotionDetails } from "./components/managePromotions/PromotionDetails";

function App() {
  const { user, loading, handleLogout } = useUser();

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
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/login" replace />}
            />

            {/* transactions */}
            <Route
              path="/transactions"
              element={
                user ? <Transactions /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/transactions/:transactionId"
              element={
                user ? <TransactionDetails /> : <Navigate to="/login" replace />
              }
            />

            {/* events */}
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

            {/* promotions */}
            <Route
              path="/promotions"
              element={user ? <Promotions /> : <Navigate to="/login" replace />}
            />
                        <Route
              path="/promotions/:promotionId"
              element={
                user ? <PromotionDetails /> : <Navigate to="/login" replace />
              }
            />

            {/* users */}
            <Route
              path="/users"
              element={user ? <Users /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/users/:userId"
              element={
                user ? <UserDetails /> : <Navigate to="/login" replace />
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
              element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/cashier"
              element={
                <ProtectedRoute clearance="CASHIER">
                  <CashierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/create-transaction"
              element={
                <ProtectedRoute clearance="CASHIER">
                  <CashierTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/process-redemption"
              element={
                <ProtectedRoute clearance="CASHIER">
                  <CashierRedemption />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
