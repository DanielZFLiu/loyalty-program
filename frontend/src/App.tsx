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
import CashierDashboard from "./pages/CashierDashboard.tsx";
import CashierTransaction from "./pages/CashierTransaction.tsx";
import CashierRedemption from "./pages/CashierRedemption.tsx";
import { getHomeByRole } from "./lib/permissions.ts";
import { Users } from "./pages/Users";
import { UserDetails } from "./pages/UserDetails";
import { TransactionDetails } from "./pages/TransactionDetails";
import { PromotionDetails } from "./components/managePromotions/PromotionDetails";

function App() {
  const { user, loading, handleLogout } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  const regularRoutes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/profile", element: <Profile /> },
    { path: "/transactions", element: <Transactions /> },
    { path: "/transactions/:transactionId", element: <TransactionDetails /> },
    { path: "/events", element: <Events /> },
    { path: "/events/:eventId", element: <EventDetails /> },
    { path: "/promotions", element: <Promotions /> },
    { path: "/promotions/:promotionId", element: <PromotionDetails /> },
    { path: "/redeem", element: <RedemptionPage /> },
  ];

  const cashierRoutes = [
    { path: "/cashier", element: <CashierDashboard /> },
    { path: "/cashier/profile", element: <Profile /> },
    { path: "/cashier/create-transaction", element: <CashierTransaction /> },
    { path: "/cashier/process-redemption", element: <CashierRedemption /> },
  ];

  // check if these are actually what we need in this interface
  // no need for superuser routes? no unique pages + navbar
  const managerRoutes = [
    // TODO: add manager dashboard
    { path: "/manager", element: <></> },
    { path: "/manager/profile", element: <Profile /> },
    { path: "/manager/users", element: <Users /> },
    { path: "/manager/users/:userId", element: <UserDetails /> },
    { path: "/manager/transactions", element: <Transactions /> },
    { path: "/manager/transactions/:transactionId", element: <TransactionDetails /> },
    { path: "/manager/events", element: <Events /> },
    { path: "/manager/events/:eventId", element: <EventDetails /> },
    { path: "/manager/promotions", element: <Promotions /> },
    { path: "/manager/promotions/:promotionId", element: <PromotionDetails /> },
  ];

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
                  <Navigate to={getHomeByRole(user.role)} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />

            {/* Regular users */}
            {regularRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute clearance="REGULAR">
                  {route.element}
                </ProtectedRoute>}
              />
            ))}

            {/* Cashiers */}
            {cashierRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute clearance="CASHIER">
                  {route.element}
                </ProtectedRoute>}
              />
            ))}

            {/* Managers (+ Superusers) */}
            {managerRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute clearance="MANAGER">
                  {route.element}
                </ProtectedRoute>}
              />
            ))}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
