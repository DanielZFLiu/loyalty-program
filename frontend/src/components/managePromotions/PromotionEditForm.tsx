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
  updatePromotion,
  type Promotion,
  type UpdatePromotionPayload,
} from "@/lib/api/promotion";

interface PromotionEditFormProps {
  promotion: Promotion;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PromotionEditForm({
  promotion,
  onSuccess,
  onCancel,
}: PromotionEditFormProps) {
  const [formData, setFormData] = useState<UpdatePromotionPayload>({
    name: promotion.name,
    description: promotion.description || "",
    type: promotion.type,
    startTime: formatDateForInput(
      promotion.startTime || new Date().toISOString()
    ),
    endTime: formatDateForInput(promotion.endTime),
    minSpending: promotion.minSpending || undefined,
    rate: promotion.rate || undefined,
    points: promotion.points,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date string for datetime-local input
  function formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

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
    if (!formData.name?.trim()) {
      return "Promotion name is required";
    }
    if (!formData.description?.trim()) {
      return "Description is required";
    }
    if (
      formData.startTime &&
      formData.endTime &&
      new Date(formData.startTime) >= new Date(formData.endTime)
    ) {
      return "End time must be after start time";
    }

    // Validate based on type
    if (formData.type === "automatic") {
      if (formData.rate !== undefined && formData.rate <= 0) {
        return "Rate must be greater than zero";
      }
      if (formData.minSpending !== undefined && formData.minSpending < 0) {
        return "Minimum spending cannot be negative";
      }
    } else if (formData.type === "one-time") {
      if (formData.points !== undefined && formData.points <= 0) {
        return "Points amount must be greater than zero";
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
      const payload: UpdatePromotionPayload = {};

      // Only include fields that have changed
      if (formData.name !== promotion.name) payload.name = formData.name;
      if (formData.description !== promotion.description)
        payload.description = formData.description;
      if (formData.type !== promotion.type) payload.type = formData.type;

      if (
        formData.startTime &&
        formatDateForInput(promotion.startTime || "") !== formData.startTime
      ) {
        payload.startTime = new Date(formData.startTime).toISOString();
      }

      if (
        formData.endTime &&
        formatDateForInput(promotion.endTime) !== formData.endTime
      ) {
        payload.endTime = new Date(formData.endTime).toISOString();
      }

      if (formData.minSpending !== promotion.minSpending) {
        payload.minSpending = formData.minSpending;
      }

      if (formData.rate !== promotion.rate) {
        payload.rate = formData.rate;
      }

      if (formData.points !== promotion.points) {
        payload.points = formData.points;
      }

      // Only make the API call if there are changes
      if (Object.keys(payload).length > 0) {
        await updatePromotion(promotion.id, payload);
      }

      onSuccess();
    } catch (err) {
      console.error("Error updating promotion:", err);
      setError(`An error occurred while updating the promotion. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Promotion</CardTitle>
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
                ? "Automatic promotions apply a rate to points earned from purchases"
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
                <Label htmlFor="rate">Rate Multiplier*</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.rate === undefined ? "" : formData.rate}
                  onChange={handleNumberChange}
                  placeholder="Rate of of x cent(s) per point"
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
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
