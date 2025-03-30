import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { api } from '../lib/api';

interface NavbarProps {
  user: {
    name: string;
    role: string;
    avatarUrl?: string;
  } | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    api.logout();
    onLogout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-white border-b py-3 px-4 md:px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-xl font-bold">
            Our App!
          </Link>
          
          {user && (
            <div className="hidden md:flex space-x-6">
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
            </div>
          )}
        </div>
        
        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage 
                    src={user.avatarUrl?.startsWith('http') 
                      ? user.avatarUrl 
                      : user.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : undefined}
                    alt={user.name} 
                  />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                
                <DropdownMenuItem onSelect={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem onSelect={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}