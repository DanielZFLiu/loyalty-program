import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserFilters } from "@/components/filters/UserFilters";
import { listUsers } from "@/lib/api/user";
import type { ListUsersQuery, User } from "@/lib/api/user";
import { checkRole } from "@/lib/api/util";
import {
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE_URL } from "@/lib/api/fetchWrapper";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    name?: string;
    role?: string;
    verified?: boolean;
    activated?: boolean;
  }>({});

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is manager or above
    const checkUserRole = async () => {
      const isManagerOrAbove = await checkRole("manager");
      setIsAuthorized(isManagerOrAbove);

      if (!isManagerOrAbove) {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    // Only fetch if user is authorized
    if (!isAuthorized) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);

        const params: ListUsersQuery = {
          page,
          limit: 10,
          ...Object.fromEntries(
            Object.entries(filters).filter(
              ([_key, value]) => value !== undefined
            )
          ),
        };
        console.log(params);

        const response = await listUsers(params);

        setUsers(response.results);
        setTotalPages(Math.ceil(response.count / 10));
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again later.");
        setUsers([]);

        // Handle authentication issues
        if (err instanceof Error && err.message.includes("401")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, filters, isAuthorized, navigate]);

  const handleFilterChange = (newFilters: {
    name?: string;
    role?: string;
    verified?: boolean;
    activated?: boolean;
  }) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "superuser":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "cashier":
        return "bg-blue-100 text-blue-800";
      case "regular":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleUserClick = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  // If not authorized, show nothing
  if (!isAuthorized && !loading) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <UserFilters onFilterChange={handleFilterChange} />

          {/* Loading and error states */}
          {loading && <div className="text-center py-8">Loading users...</div>}
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Users list */}
          {!loading && !error && (
            <>
              {users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card
                      key={user.id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              {user.avatarUrl ? (
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
                              ) : null}
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold">
                                  {user.name}
                                </h3>
                                {user.role && (
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                      user.role
                                    )}`}
                                  >
                                    {user.role}
                                  </span>
                                )}
                                {user.verified !== undefined &&
                                  (user.verified ? (
                                    <Badge
                                      classes="bg-green-300 text-green-800 border-green-200"
                                      text="Verified"
                                      innerChild={
                                        <UserCheck className="h-3 w-3 mr-1" />
                                      }
                                    ></Badge>
                                  ) : (
                                    <Badge
                                      classes="bg-yellow-300 text-yellow-800 border-yellow-200"
                                      text="Unverified"
                                      innerChild={
                                        <UserX className="h-3 w-3 mr-1" />
                                      }
                                    ></Badge>
                                  ))}
                              </div>

                              <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <p className="flex items-center">
                                  <Shield className="h-4 w-4 mr-2" /> UTORid:{" "}
                                  {user.utorid}
                                </p>
                                {user.email && (
                                  <p className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2" />{" "}
                                    {user.email}
                                  </p>
                                )}
                                {user.birthday && (
                                  <p className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />{" "}
                                    Birthday: {formatDate(user.birthday)}
                                  </p>
                                )}
                                {user.lastLogin && (
                                  <p className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2" /> Last
                                    Login: {formatDate(user.lastLogin)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="text-right mr-4">
                              <p className="text-lg font-semibold">
                                {user.points} points
                              </p>
                              {user.createdAt && (
                                <p className="text-xs text-gray-500">
                                  Member since {formatDate(user.createdAt)}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No users found matching your filters
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 0 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
