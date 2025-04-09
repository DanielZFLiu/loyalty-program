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
import { createEvent } from "@/lib/api/event";
import type { CreateEventPayload } from "@/lib/api/event";
import { CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventCreateFormProps {
  onSuccess?: (eventId: number) => void;
  onCancel: () => void;
}

export function EventCreateForm({ onSuccess, onCancel }: EventCreateFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateEventPayload>({
    name: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    capacity: null,
    points: 0,
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : parseInt(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };
  
      const response = await createEvent(payload);
  
      if (response.id) {
        if (onSuccess) {
          onSuccess(response.id);
        } else {
          navigate(`/events/${response.id}`);
        }
      } else {
        if (response.error && typeof response.error === 'string') {
          setError(response.error);
        } else {
          setError("Failed to create event. Please check your information and try again.");
        }
      }
    } catch (err) {
      console.error("Error creating event:", err);
      
      // Extract error message if available
      let errorMessage = "";
      
      if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = err.message;
        
        // Check for the specific pattern in the error message
        if (typeof errorMessage === 'string' && errorMessage.includes('Request failed with status')) {
          const match = errorMessage.match(/Request failed with status \d+: (.*)/);
          if (match && match[1]) {
            setError(match[1]);
            return;
          }
        }
      }
      
      // If we couldn't extract a specific error message, use the default
      setError("An error occurred while creating the event. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
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
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Event description"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Event"}
        </Button>
      </CardFooter>
    </Card>
  );
}
