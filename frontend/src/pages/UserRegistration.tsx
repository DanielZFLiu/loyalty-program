// UserRegistration.tsx
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
import { resetPassword } from "@/lib/api/auth";
import {
  CheckCircle,
  UserPlus,
  AlertCircle,
  Mail,
  User,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export function UserRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<RegisterUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCheckLoading, setAuthCheckLoading] = useState(true);
  const [passwordSet, setPasswordSet] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState<
    RegisterUserInput & { password: string; confirmPassword: string }
  >({
    utorid: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Form validation state
  const [validation, setValidation] = useState({
    utorid: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      utorid: !formData.utorid.trim()
        ? "UTORid is required"
        : !/^[A-Za-z0-9]{8}$/.test(formData.utorid.trim())
        ? "UTORid must be exactly 8 alphanumeric characters"
        : "",
      name: !formData.name.trim()
        ? "Name is required"
        : formData.name.trim().length > 50
        ? "Name must be between 1 and 50 characters"
        : "",
      email: !formData.email.trim()
        ? "Email is required"
        : !/^[\w\.-]+@mail\.utoronto\.ca$/.test(formData.email.trim())
        ? "Please enter a valid University of Toronto email"
        : "",
      password: !formData.password
        ? "Password is required"
        : formData.password.length < 8 || formData.password.length > 20
        ? "Password must be between 8 and 20 characters"
        : !/(?=.*[A-Z])/.test(formData.password)
        ? "Password must contain at least one uppercase letter"
        : !/(?=.*[a-z])/.test(formData.password)
        ? "Password must contain at least one lowercase letter"
        : !/(?=.*\d)/.test(formData.password)
        ? "Password must contain at least one number"
        : !/(?=.*[!"#$%&'()*+,\-./:;<=>?@$begin:math:display$\\\\$end:math:display$^_`{|}~])/.test(formData.password)
        ? "Password must contain at least one special character"
        : "",
      confirmPassword:
        formData.password !== formData.confirmPassword
          ? "Passwords do not match"
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
      setPasswordSet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPasswordSet(false);

    try {
      // 1. Register the user first
      const registerResponse = await registerUser({
        utorid: formData.utorid,
        name: formData.name,
        email: formData.email,
      });

      if (registerResponse.error) {
        throw new Error(registerResponse.error);
      }

      // 2. Use the reset token to set the initial password
      try {
        await resetPassword(
          registerResponse.resetToken,
          formData.utorid,
          formData.password
        );
        setPasswordSet(true);
      } catch (pwError) {
        console.error("Error setting password:", pwError);
        setError(
          "User registered but failed to set password. They can use password reset option to set password."
        );
      }

      setSuccess(registerResponse);

      // Reset form after successful registration
      setFormData({
        utorid: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
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
      password: "",
      confirmPassword: "",
    });
    setValidation({
      utorid: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setError(null);
    setSuccess(null);
    setPasswordSet(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                Create an account with password for a new user
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
                {passwordSet && (
                  <p className="font-medium mt-1">
                    Initial password has been set.
                  </p>
                )}
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
            <Alert
              variant="destructive"
              classes="mb-6 bg-red-50 border-red-200 p-5"
            >
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
                University of Toronto ID (e.g., liudan10)
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

            <div className="border-t pt-4">
              <h3 className="text-base font-medium mb-4">Initial Password</h3>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center">
                  Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 ${
                      validation.password ? "border-red-500" : ""
                    }`}
                    placeholder="Create password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {validation.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {validation.password}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase,
                  special character, and numbers
                </p>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="confirmPassword" className="flex items-center">
                  Confirm Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`pl-10 ${
                      validation.confirmPassword ? "border-red-500" : ""
                    }`}
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                </div>
                {validation.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {validation.confirmPassword}
                  </p>
                )}
              </div>
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
