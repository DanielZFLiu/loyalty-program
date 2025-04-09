import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPromotion,
  type CreatePromotionPayload,
} from "@/lib/api/promotion";

interface PromotionCreateFormProps {
  onSuccess: (promotionId: number) => void;
  onCancel: () => void;
}

export function PromotionCreateForm({
  onSuccess,
  onCancel,
}: PromotionCreateFormProps) {
  const [formData, setFormData] = useState<CreatePromotionPayload>({
    name: "",
    description: "",
    type: "automatic",
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    minSpending: undefined,
    rate: undefined,
    points: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : Number(value),
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Promotion name is required";
    }
    if (!formData.description.trim()) {
      return "Description is required";
    }
    if (!formData.startTime) {
      return "Start time is required";
    }
    if (!formData.endTime) {
      return "End time is required";
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      return "End time must be after start time";
    }

    // Validate based on type
    if (formData.type === "automatic") {
      if (!formData.rate) {
        return "Promotional rate is required for automatic promotions";
      }
      if (formData.minSpending === undefined) {
        return "Minimum spending amount is required for automatic promotions";
      }
    } else if (formData.type === "one-time") {
      if (!formData.points) {
        return "Points amount is required for one-time promotions";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert dates to ISO strings if they're not already
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      const response = await createPromotion(payload);

      if (response.id) {
        onSuccess(response.id);
      } else {
        setError(
          "Failed to create promotion. Please check your information and try again."
        );
      }
    } catch (err) {
      console.error("Error creating promotion:", err);
      setError(
        "An error occurred while creating the promotion. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" classes="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Promotion Name*</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter promotion name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe this promotion"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Promotion Type*</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                handleSelectChange("type", value as "automatic" | "one-time")
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select promotion type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">
                  Automatic (Rate-based)
                </SelectItem>
                <SelectItem value="one-time">
                  One-time (Fixed Points)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {formData.type === "automatic"
                ? "Automatic promotions apply a promotional rate to points earned from purchases"
                : "One-time promotions award a fixed number of points"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time*</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time*</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {formData.type === "automatic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSpending">Minimum Spending (USD)*</Label>
                <Input
                  id="minSpending"
                  name="minSpending"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formData.minSpending === undefined
                      ? ""
                      : formData.minSpending
                  }
                  onChange={handleNumberChange}
                  placeholder="Minimum amount in dollars"
                  required={formData.type === "automatic"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Promotional Rate*</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.rate === undefined ? "" : formData.rate}
                  onChange={handleNumberChange}
                  placeholder="rate of 1 cent per point redeemed"
                  required={formData.type === "automatic"}
                />
              </div>
            </div>
          )}

          {formData.type === "one-time" && (
            <div className="space-y-2">
              <Label htmlFor="points">Points Award*</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="1"
                value={formData.points === undefined ? "" : formData.points}
                onChange={handleNumberChange}
                placeholder="Number of points to award"
                required={formData.type === "one-time"}
              />
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Promotion"}
        </Button>
      </CardFooter>
    </Card>
  );
}
