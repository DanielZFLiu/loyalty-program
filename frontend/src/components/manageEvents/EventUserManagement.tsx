import { JSX, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addEventOrganizer,
  removeEventOrganizer,
  addEventGuest,
  removeEventGuest,
  type Event,
} from "@/lib/api/event";
import { getUser } from "@/lib/api/user";
import { UserCheck } from "lucide-react";

interface EventUserManagementProps {
  event: Event;
  isManager: boolean;
  onSuccess: () => void;
}

export function EventUserManagement({
  event,
  isManager,
  onSuccess,
}: EventUserManagementProps) {
  const [activeTab, setActiveTab] = useState(isManager ? "organizers" : "guests");
  const [organizerUtorid, setOrganizerUtorid] = useState("");
  const [guestUtorid, setGuestUtorid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddOrganizer = async () => {
    if (!organizerUtorid.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await addEventOrganizer(event.id, { utorid: organizerUtorid });
      setSuccess(`Successfully added ${organizerUtorid} as an organizer`);
      setOrganizerUtorid("");
      onSuccess();
    } catch (err) {
      console.error("Error adding organizer:", err);
      setError(
        "Failed to add organizer. Please check the UTORid and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOrganizer = async (userId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await removeEventOrganizer(event.id, userId);
      setSuccess("Successfully removed organizer");
      onSuccess();
    } catch (err) {
      console.error("Error removing organizer:", err);
      setError("Failed to remove organizer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!guestUtorid.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await addEventGuest(event.id, { utorid: guestUtorid });
      setSuccess(`Successfully added ${guestUtorid} as a guest`);
      setGuestUtorid("");
      onSuccess();
    } catch (err) {
      console.error("Error adding guest:", err);
      setError("Failed to add guest. Please check the UTORid and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuest = async (userId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if user is a manager (only managers can remove guests)
      if (!isManager) {
        setError("Only managers can remove guests from events.");
        setLoading(false);
        return;
      }

      await removeEventGuest(event.id, userId);
      setSuccess("Successfully removed guest");
      onSuccess();
    } catch (err) {
      console.error("Error removing guest:", err);
      setError("Failed to remove guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  async function getUserDetails(id: number) {
    const response = await getUser(id);
    if (response.name && response.utorid) {
      return (
        <span>
          {response.name || "Unknown"} ({response.utorid || "No UTORid"})
        </span>
      );
    }
  }

  function UserDetails({ id }: { id: number }) {
    const [details, setDetails] = useState<JSX.Element | null>(null);

    useEffect(() => {
      async function fetchDetails() {
        const result = await getUserDetails(id);
        setDetails(result || <span>Unknown user</span>);
      }
      fetchDetails();
    }, [id]);

    return details;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Manage Event Users</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" classes="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert classes="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isManager && (
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="organizers">Organizers</TabsTrigger>
              <TabsTrigger value="guests">Guests</TabsTrigger>
            </TabsList>
          )}

            <TabsContent value="organizers" className="space-y-4">
            {isManager ? (
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organizer-utorid">Add Organizer (UTORid)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="organizer-utorid"
                      value={organizerUtorid}
                      onChange={(e) => setOrganizerUtorid(e.target.value)}
                      placeholder="Enter UTORid"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleAddOrganizer}
                      disabled={!organizerUtorid.trim() || loading}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Only managers can add organizers to events.
              </div>
            )}            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Current Organizers</h4>
              {event.organizers && event.organizers.length > 0 ? (
                <div className="space-y-2">
                  {event.organizers.map((organizer) => (
                    <div
                      key={organizer.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>
                          {organizer.name} ({organizer.utorid})
                        </span>
                      </div>
                      {isManager && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveOrganizer(organizer.id)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No organizers added yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="guest-utorid" className="mt-3 mb-3">
                  Add Guest by UTORid
                </Label>
                <Input
                  id="guest-utorid"
                  value={guestUtorid}
                  onChange={(e) => setGuestUtorid(e.target.value)}
                  placeholder="Enter UTORid"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleAddGuest}
                disabled={loading || !guestUtorid.trim()}
              >
                Add
              </Button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Current Guests</h4>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-2">
                  {event.guests?.length || 0}/{event.capacity || "∞"}
                </span>
              </div>

              {event.guests && event.guests.length > 0 ? (
                <div className="space-y-2">
                  {event.guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <UserDetails id={guest.id} />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {isManager && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveGuest(guest.id)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No guests added yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
