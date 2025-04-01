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
import { Switch } from "@/components/ui/switch";
import {
  updateEvent,
  type Event,
  type UpdateEventPayload,
} from "@/lib/api/event";
import { CalendarIcon } from "lucide-react";

interface EventEditFormProps {
  event: Event;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventEditForm({
  event,
  onSuccess,
  onCancel,
}: EventEditFormProps) {
  const [formData, setFormData] = useState<UpdateEventPayload>({
    name: event.name,
    description: event.description || "",
    location: event.location,
    startTime: formatDateForInput(event.startTime),
    endTime: formatDateForInput(event.endTime),
    capacity: event.capacity,
    points: event.pointsRemain || 0,
    published: event.published || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date string for datetime-local input
  function formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : parseInt(value),
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert dates to ISO strings if they're not already
      const payload = {
        ...formData,
        startTime: formData.startTime
          ? new Date(formData.startTime).toISOString()
          : undefined,
        endTime: formData.endTime
          ? new Date(formData.endTime).toISOString()
          : undefined,
      };

      const response = await updateEvent(event.id, payload);

      if (response.id) {
        onSuccess();
      } else {
        setError(
          "Failed to update event. Please check your information and try again."
        );
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setError("An error occurred while updating the event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" classes="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name*</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter event name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location*</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Event location"
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity (leave empty for unlimited)
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="0"
                value={formData.capacity === null ? "" : formData.capacity}
                onChange={handleNumberChange}
                placeholder="Number of participants"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points to Award*</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="0"
                required
                value={formData.points}
                onChange={handleNumberChange}
                placeholder="Points to award participants"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Event description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={!!formData.published}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="published">Publish Event</Label>
          </div>
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
