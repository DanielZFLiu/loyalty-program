import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { API_BASE_URL } from '@/lib/api/fetchWrapper';
import { User } from '@/lib/api/userMe';
import { Roles } from '@/lib/permissions';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  let currentInterface: Roles = 'REGULAR';
  const path = location.pathname;
  if (path.startsWith('/cashier')) {
    currentInterface = 'CASHIER';
  }
  if (path.startsWith('/manager')) {
    currentInterface = 'MANAGER';
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiresAt");
    onLogout();
    navigate("/login");
  };

  const renderLinks = () => {
    switch (currentInterface) {
      case 'CASHIER':
        return (
          <>
            <Link to="/cashier" className="text-gray-600 hover:text-black">
              Dashboard
            </Link>
            <Link to="/cashier/create-transaction" className="text-gray-600 hover:text-black">
              Create Transaction
            </Link>
            <Link to="/cashier/process-redemption" className="text-gray-600 hover:text-black">
              Process Redemption
            </Link>
            <Link to="/cashier/registration" className="text-gray-600 hover:text-black">
              User Registration
            </Link>
          </>
        );
      case 'MANAGER':
        return (
          <>
            <Link to="/manager" className="text-gray-600 hover:text-black">
              Dashboard
            </Link>
            <Link to="/manager/transactions" className="text-gray-600 hover:text-black">
              Transactions
            </Link>
            <Link to="/manager/promotions" className="text-gray-600 hover:text-black">
              Promotions
            </Link>
            <Link to="/manager/events" className="text-gray-600 hover:text-black">
              Events
            </Link>
            <Link to="/manager/users" className="text-gray-600 hover:text-black">
              Users
            </Link>
            <Link to="/manager/registration" className="text-gray-600 hover:text-black">
              User Registration
            </Link>
          </>
        );
      default:
        return (
          <>
            <Link to="/dashboard" className="text-gray-600 hover:text-black">
              Dashboard
            </Link>
            <Link to="/transactions" className="text-gray-600 hover:text-black">
              Transactions
            </Link>
            <Link to="/promotions" className="text-gray-600 hover:text-black">
              Promotions
            </Link>
            <Link to="/events" className="text-gray-600 hover:text-black">
              Events
            </Link>
            <Link to="/redeem" className="text-gray-600 hover:text-black">
              Redeem Points
            </Link>
          </>
        );
    }
  };

  const interfaceDisplay = currentInterface.charAt(0).toUpperCase() + currentInterface.slice(1).toLowerCase();

  return (
    <nav className="bg-white border-b py-3 px-4 md:px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link 
            to={(() => {
              const currentPath = window.location.pathname;
              if (currentPath.startsWith('/cashier')) {
                return '/cashier';
              } else if (currentPath.startsWith('/manager')) {
                return '/manager';
              }
              return '/dashboard';
            })()}
            className="text-xl font-bold"
          >
            βασιλεία
          </Link>

          {user && (
            <div className="hidden md:flex space-x-6">
              {renderLinks()}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 hidden md:block">
            {interfaceDisplay} Interface
          </div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage
                    src={
                      user.avatarUrl?.startsWith("http")
                        ? user.avatarUrl
                        : user.avatarUrl
                          ? `${API_BASE_URL}${user.avatarUrl}`
                          : undefined
                    }
                    alt={user.name}
                  />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>

                {(user.role === 'MANAGER' || user.role === 'SUPERUSER' || user.role === 'CASHIER') && (
                  <>
                    <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
                      Switch to Regular Interface
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/cashier")}>
                      Switch to Cashier Interface
                    </DropdownMenuItem>
                    {(user.role === 'MANAGER' || user.role === 'SUPERUSER') && (
                      <DropdownMenuItem onSelect={() => navigate("/manager")}>
                        Switch to Manager Interface
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem 
                  onSelect={() => {
                    const currentPath = window.location.pathname;
                    if (currentPath.startsWith('/cashier')) {
                      navigate('/cashier/profile');
                    } else if (currentPath.startsWith('/manager')) {
                      navigate('/manager/profile');
                    } else {
                      navigate('/profile');
                    }
                  }}
                >
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/login")}>Login</Button>
          )}
        </div>
      </div>
    </nav>
  );
}
