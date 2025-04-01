import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { getMe, updateMe, updatePassword } from "@/lib/api/userMe";
import type { User as UserProfile } from "@/lib/api/userMe";
import { API_BASE_URL } from "@/lib/api/fetchWrapper";

interface PasswordData {
  old: string;
  new: string;
  confirmNew: string;
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [passwordData, setPasswordData] = useState<PasswordData>({
    old: "",
    new: "",
    confirmNew: "",
  });
  const [error, setError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMe();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/login");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePassword = (password: string): boolean => {
    // 8-20 characters, at least one uppercase, one lowercase, one number, one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = {
        name: formData.name,
        email: formData.email,
        birthday: formData.birthday,
        avatar: avatarFile,
      };
      // @ts-ignore
      const response = await updateMe(data);

      console.log("Updated profile received:", response);
      setProfile(response);

      setIsEditing(false);
      setFormData({});
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords
    if (passwordData.new !== passwordData.confirmNew) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (!validatePassword(passwordData.new)) {
      setPasswordError(
        "Password must be 8-20 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    try {
      await updatePassword(passwordData.old, passwordData.new);

      // Reset password form
      setPasswordData({
        old: "",
        new: "",
        confirmNew: "",
      });
      setPasswordSuccess("Password updated successfully!");

      // Close password form after successful update
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess("");
      }, 3000);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Failed to update password"
      );
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile.avatarUrl ? (
                  <img
                    src={
                      profile.avatarUrl.startsWith("http")
                        ? profile.avatarUrl
                        : `${API_BASE_URL}${profile.avatarUrl}`
                    }
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl text-gray-500">
                      {profile.name?.charAt(0).toUpperCase() ||
                        profile.utorid?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {isEditing && (
                <div>
                  <input
                    type="file"
                    id="avatar"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Avatar
                  </Button>
                </div>
              )}
            </div>

            {/* Form section */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="utorid">UTORid</Label>
                  <Input
                    id="utorid"
                    name="utorid"
                    value={profile.utorid}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={
                      isEditing ? formData.name || profile.name : profile.name
                    }
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={
                      isEditing
                        ? formData.email || profile.email
                        : profile.email
                    }
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={
                      isEditing
                        ? formData.birthday || profile.birthday || ""
                        : profile.birthday || ""
                    }
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({});
                          setError("");
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Password</h3>
                <p className="text-sm text-gray-500">
                  Change your account password
                </p>
              </div>
              <Button type="button" onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old">Current Password</Label>
                <Input
                  id="old"
                  name="old"
                  type="password"
                  value={passwordData.old}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  name="new"
                  type="password"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNew">Confirm New Password</Label>
                <Input
                  id="confirmNew"
                  name="confirmNew"
                  type="password"
                  value={passwordData.confirmNew}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <p className="text-xs text-gray-500">
                Password must be 8-20 characters and include at least one
                uppercase letter, one lowercase letter, one number, and one
                special character.
              </p>

              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-green-500 text-sm">{passwordSuccess}</p>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      old: "",
                      new: "",
                      confirmNew: "",
                    });
                    setPasswordError("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Password</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
