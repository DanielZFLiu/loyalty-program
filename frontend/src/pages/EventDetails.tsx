import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  addMyGuest,
  getEvent,
  removeMyGuest,
  type Event as EventDetail,
} from "@/lib/api/event";
import { checkRole } from "@/lib/api/util";
import { EventActionDialogs } from "@/components/eventDetails/EventActionDialogs";
import { EventInformation } from "@/components/eventDetails/EventInformation";

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<boolean>(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  // State for manager action dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);

  // Function to check RSVP status by attempting to RSVP
  const checkRsvpStatus = async () => {
    const data = await addMyGuest(Number(eventId));

    console.log("Errors are expected here. Especially 500 internal server error and failed to parse JSON error.");
    if (data.status == 400) {
      // already rsvped
      setRsvpStatus(true);
      return;
    } else if (data.error) {
      setRsvpStatus(false);
      return;
    } else {
      setEvent((prev) =>
        prev ? { ...prev, numGuests: data.numGuests } : null
      );

      // Now cancel this RSVP since we were just checking
      const cancelResponse = await removeMyGuest(Number(eventId));

      if (!cancelResponse.error) setRsvpStatus(false);
      else setRsvpStatus(true);
    }
  };

  const checkManagerStatus = async () => {
    const isManagerOrAbove = await checkRole("manager");
    setIsManager(isManagerOrAbove);
    return isManagerOrAbove;
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user is manager
        await checkManagerStatus();

        // Fetch event details
        const response = await getEvent(Number(eventId));

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (response.status === 404) {
          setError("Event not found or not published.");
          setLoading(false);
          return;
        }

        setEvent(response);

        // If the user is not a manager, check the RSVP status
        if (!isManager) {
          await checkRsvpStatus();
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, navigate]);

  const handleRsvp = async () => {
    setRsvpLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await addMyGuest(Number(eventId));

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (response.status === 410) {
        setError("This event is full or has already ended.");
        return;
      }

      if (response.status === 400) {
        // Already RSVP'd
        setRsvpStatus(true);
        setStatusMessage("You've already RSVP'd to this event!");
        return;
      }

      // Update the event with new guest count
      setEvent((prev) =>
        prev ? { ...prev, numGuests: response.numGuests } : null
      );
      setRsvpStatus(true);
      setStatusMessage("You've successfully RSVP'd to this event!");
    } catch (error) {
      console.error("Error RSVPing to event:", error);
      setError("Failed to RSVP. Please try again later.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRsvp = async () => {
    setRsvpLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await removeMyGuest(Number(eventId));

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (response.status === 410) {
        setError("You cannot cancel RSVP for an event that has already ended.");
        return;
      }

      if (response.status === 404) {
        // Not RSVP'd
        setRsvpStatus(false);
        setStatusMessage("You haven't RSVP'd to this event yet.");
        return;
      }

      // Update the event with reduced guest count
      setEvent((prev) =>
        prev
          ? { ...prev, numGuests: prev.numGuests ? prev.numGuests - 1 : 0 }
          : null
      );
      setRsvpStatus(false);
      setStatusMessage("Your RSVP has been cancelled.");
    } catch (error) {
      console.error("Error canceling RSVP:", error);
      setError("Failed to cancel RSVP. Please try again later.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventStatus = () => {
    if (!event) return "";

    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (now < startTime) return "Upcoming";
    if (now >= startTime && now <= endTime) return "Ongoing";
    return "Completed";
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800";
      case "Ongoing":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Derived state
  const status = event ? getEventStatus() : "";
  const isEventFull = event
    ? event.capacity
      ? (event.numGuests ? event.numGuests : 0) >= event.capacity
      : false
    : false;
  const isEventEnded = status === "Completed";

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-6">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-100 text-red-800 p-4 rounded-md">
              {error || "Event not found"}
            </div>
            <Button className="mt-4" onClick={() => navigate("/events")}>
              Back to Events
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
          <EventInformation
            event={event}
            isManager={isManager}
            rsvpStatus={rsvpStatus}
            rsvpLoading={rsvpLoading}
            isEventFull={isEventFull}
            isEventEnded={isEventEnded}
            handleRsvp={handleRsvp}
            handleCancelRsvp={handleCancelRsvp}
            formatDateTime={formatDateTime}
            getEventStatus={getEventStatus}
            getEventStatusColor={getEventStatusColor}
            setEditDialogOpen={setEditDialogOpen}
            setDeleteDialogOpen={setDeleteDialogOpen}
            setPointsDialogOpen={setPointsDialogOpen}
            navigate={navigate}
            setEvent={setEvent}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" classes="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {statusMessage && (
            <Alert
              variant="default"
              classes="mb-4 bg-green-50 text-green-800 border-green-200"
            >
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manager action dialogs */}
      {isManager && (
        <EventActionDialogs
          event={event}
          editDialogOpen={editDialogOpen}
          setEditDialogOpen={setEditDialogOpen}
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          pointsDialogOpen={pointsDialogOpen}
          setPointsDialogOpen={setPointsDialogOpen}
          onDeleteSuccess={() => {
            setStatusMessage("Event deleted successfully!");
          }}
          onError={(message) => setError(message)}
          onSuccess={(message) => setStatusMessage(message)}
          setEvent={setEvent}
          eventId={Number(eventId)}
          navigate={navigate}
        />
      )}
    </div>
  );
}
