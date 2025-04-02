import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type User, type UpdateUserInput } from "@/lib/api/user";
import { Card, CardContent } from "@/components/ui/card";

interface UserEditFormProps {
  user: User;
  onUpdate: (data: UpdateUserInput) => void;
  onCancel: () => void;
}

export function UserEditForm({ user, onUpdate, onCancel }: UserEditFormProps) {
  const [formData, setFormData] = useState<UpdateUserInput>({
    email: user.email || "",
    role: user.role || "regular",
    verified: user.verified || false,
    suspicious: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleVerifiedChange = (checked: boolean) => {
    // API only allows setting verified to true
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        verified: true,
      }));
    } else {
      setFormData((prev) => {
        const { verified, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSuspiciousChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      suspicious: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Remove empty values
      const cleanData: UpdateUserInput = {};
      if (formData.email) cleanData.email = formData.email;
      if (formData.role) cleanData.role = formData.role;
      if (formData.verified) cleanData.verified = formData.verified;
      if (formData.suspicious !== undefined)
        cleanData.suspicious = formData.suspicious;

      await onUpdate(cleanData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-dashed border-blue-200 bg-blue-50/50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="User email address"
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select
              value={formData.role?.toLowerCase() || "regular"}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger id="role" className="max-w-md">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="superuser">Superuser</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Regular: Basic user privileges
              <br />
              Cashier: Can process transactions
              <br />
              Manager: Can manage events, promotions, etc.
              <br />
              Superuser: Full administrative access
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="verified"
              checked={formData.verified || false}
              onCheckedChange={handleVerifiedChange}
              disabled={user.verified} // Can't unverify a verified user
            />
            <Label htmlFor="verified" className="cursor-pointer">
              Mark as Verified
              {user.verified && (
                <span className="ml-2 text-sm text-green-600">
                  (Already verified - cannot be undone)
                </span>
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="suspicious"
              checked={formData.suspicious || false}
              onCheckedChange={handleSuspiciousChange}
            />
            <Label htmlFor="suspicious" className="cursor-pointer">
              Flag account as Suspicious
            </Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
