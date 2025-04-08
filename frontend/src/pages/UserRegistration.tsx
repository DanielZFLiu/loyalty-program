import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkRole } from "@/lib/api/util";
import {
  registerUser,
  type RegisterUserInput,
  type RegisterUserResponse,
} from "@/lib/api/user";
import {
  CheckCircle,
  UserPlus,
  AlertCircle,
  Mail,
  User,
  ShieldCheck,
} from "lucide-react";

export function UserRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<RegisterUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCheckLoading, setAuthCheckLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState<RegisterUserInput>({
    utorid: "",
    name: "",
    email: "",
  });

  // Form validation state
  const [validation, setValidation] = useState({
    utorid: "",
    name: "",
    email: "",
  });

  useEffect(() => {
    // Check if user has permission (cashier or above)
    const checkPermission = async () => {
      setAuthCheckLoading(true);
      try {
        const authorized = await checkRole("cashier");
        setIsAuthorized(authorized);
        if (!authorized) {
          setError("You don't have permission to register new users.");
        }
      } catch (err) {
        console.error("Error checking permissions:", err);
        setError("Unable to verify your permissions.");
      } finally {
        setAuthCheckLoading(false);
      }
    };

    checkPermission();
  }, []);

  const validateForm = (): boolean => {
    const newValidation = {
      utorid: !formData.utorid.trim() ? "UTORid is required" : "",
      name: !formData.name.trim() ? "Name is required" : "",
      email: !formData.email.trim()
        ? "Email is required"
        : !/\S+@\S+\.\S+/.test(formData.email)
        ? "Please enter a valid email address"
        : "",
    };

    setValidation(newValidation);
    return !Object.values(newValidation).some((error) => error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user types
    if (validation[name as keyof typeof validation]) {
      setValidation((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear success/error messages when form changes
    if (success || error) {
      setSuccess(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerUser(formData);
      setSuccess(response);

      // Reset form after successful registration
      setFormData({
        utorid: "",
        name: "",
        email: "",
      });
    } catch (err) {
      console.error("Error registering user:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to register user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      utorid: "",
      name: "",
      email: "",
    });
    setValidation({
      utorid: "",
      name: "",
      email: "",
    });
    setError(null);
    setSuccess(null);
  };

  if (authCheckLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to register new users. This feature is
            only available to cashiers and above.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserPlus className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-2xl">Register New User</CardTitle>
              <CardDescription>
                Create an account for a new user
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {success && (
            <Alert classes="mb-6 bg-green-50 border-green-200 p-5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle classes="text-green-800">
                Registration Successful!
              </AlertTitle>
              <AlertDescription classes="text-green-700">
                <p>User {success.name} has been registered successfully.</p>
                <div className="mt-2 p-3 bg-green-100 rounded-md">
                  <p className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> User ID: {success.id}
                  </p>
                  <p className="text-sm flex items-center gap-2 mt-1">
                    <ShieldCheck className="h-4 w-4" /> UTORid: {success.utorid}
                  </p>
                  <p className="text-sm flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" /> Email: {success.email}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" classes="mb-6 p-5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="utorid" className="flex items-center">
                UTORid <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="utorid"
                  name="utorid"
                  value={formData.utorid}
                  onChange={handleChange}
                  className={`pl-10 ${
                    validation.utorid ? "border-red-500" : ""
                  }`}
                  placeholder="Enter UTORid"
                  disabled={loading}
                />
              </div>
              {validation.utorid && (
                <p className="text-sm text-red-500 mt-1">{validation.utorid}</p>
              )}
              <p className="text-xs text-gray-500">
                University of Toronto ID (e.g., smithj)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                Full Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`pl-10 ${validation.name ? "border-red-500" : ""}`}
                  placeholder="Enter full name"
                  disabled={loading}
                />
              </div>
              {validation.name && (
                <p className="text-sm text-red-500 mt-1">{validation.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                Email Address <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${
                    validation.email ? "border-red-500" : ""
                  }`}
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>
              {validation.email && (
                <p className="text-sm text-red-500 mt-1">{validation.email}</p>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Reset Form
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Registering..." : "Register User"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
