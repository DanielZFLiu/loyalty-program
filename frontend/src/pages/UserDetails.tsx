import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getUser,
  updateUser,
  type User,
  type UpdateUserInput,
} from "@/lib/api/user";
import { checkRole } from "@/lib/api/util";
import { UserEditForm } from "@/components/manageUsers/UserEditForm";
import { API_BASE_URL } from "@/lib/api/fetchWrapper";
import { Shield, UserCheck, UserX, Calendar, Mail, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const checkManagerStatus = async () => {
      const isManagerOrAbove = await checkRole("manager");
      setIsManager(isManagerOrAbove);

      if (!isManagerOrAbove) {
        setLoading(false);
        setError("You don't have permission to view user details.");
      }
      return isManagerOrAbove;
    };

    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user is manager
        const hasAccess = await checkManagerStatus();
        if (!hasAccess) return;

        // Fetch user details
        const response = await getUser(Number(userId));
        setUser(response);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError("Failed to load user details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, navigate]);

  const handleUpdate = async (data: UpdateUserInput) => {
    setError(null);
    setStatusMessage(null);
  
    try {
      const updatedUser = await updateUser(Number(userId), data);
      
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updatedUser,
          suspicious: data.suspicious !== undefined ? data.suspicious : prev.suspicious
        };
      });
      
      setEditMode(false);
      setStatusMessage("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      setError(`Failed to update user. ${error}`);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-6">
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-100 text-red-800 p-4 rounded-md">
              {error || "User not found"}
            </div>
            <Button className="mt-4" onClick={() => navigate("/manager/users")}>
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">User Details</CardTitle>
            {isManager && !editMode && (
              <Button onClick={() => setEditMode(true)}>Edit User</Button>
            )}
            {editMode && (
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {statusMessage && (
            <Alert classes="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" classes="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {editMode ? (
            <UserEditForm
              user={user}
              onUpdate={handleUpdate}
              onCancel={() => setEditMode(false)}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={
                        user.avatarUrl?.startsWith("http")
                          ? user.avatarUrl
                          : `${API_BASE_URL}${user.avatarUrl}`
                      }
                      alt={user.name}
                    />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
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
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                          }
                        ></Badge>
                      ) : (
                        <Badge
                          classes="bg-yellow-300 text-yellow-800 border-yellow-200"
                          text="Unverified"
                          innerChild={<UserX className="h-3.5 w-3.5 mr-1" />}
                        ></Badge>
                      ))}
                      {user.suspicious !== undefined && user.suspicious && (
                        <Badge
                          classes="bg-red-100 text-red-800 border-red-200"
                          text="Suspicious"
                          innerChild={<AlertCircle className="h-3.5 w-3.5 mr-1" />}
                        ></Badge>
                      )}
                  </div>

                  <div className="text-lg font-semibold text-blue-600 mb-4">
                    {user.points} points
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      UTORid
                    </h4>
                    <p className="text-md flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-500" />
                      {user.utorid}
                    </p>
                  </div>

                  {user.email && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Email
                      </h4>
                      <p className="text-md flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-blue-500" />
                        {user.email}
                      </p>
                    </div>
                  )}

                  {user.birthday && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Birthday
                      </h4>
                      <p className="text-md flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDate(user.birthday)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Activity</h3>

                  {user.createdAt && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Member Since
                      </h4>
                      <p className="text-md">{formatDate(user.createdAt)}</p>
                    </div>
                  )}

                  {user.lastLogin && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Last Login
                      </h4>
                      <p className="text-md flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDate(user.lastLogin)}
                      </p>
                    </div>
                  )}

                  {user.promotions && user.promotions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Active Promotions
                      </h4>
                      <ul className="list-disc pl-5 mt-1">
                        {user.promotions.map((promotion) => (
                          <li key={promotion.id}>{promotion.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button variant="outline" onClick={() => navigate("/manager/users")}>
            Back to Users
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
