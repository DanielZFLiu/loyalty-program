// EventInformation.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoinsIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { EventUserManagement } from "@/components/eventDetails/EventUserManagement";
import { type Event, getEvent } from "@/lib/api/event";

interface EventInformationProps {
  event: Event;
  isManager: boolean;
  rsvpStatus: boolean;
  rsvpLoading: boolean;
  isEventFull: boolean;
  isEventEnded: boolean;
  handleRsvp: () => Promise<void>;
  handleCancelRsvp: () => Promise<void>;
  formatDateTime: (dateString: string) => string;
  getEventStatus: () => string;
  getEventStatusColor: (status: string) => string;
  setEditDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setPointsDialogOpen: (open: boolean) => void;
  navigate: (path: string) => void;
  setEvent: (event: Event) => void;
}

export function EventInformation({
  event,
  isManager,
  rsvpStatus,
  rsvpLoading,
  isEventFull,
  isEventEnded,
  handleRsvp,
  handleCancelRsvp,
  formatDateTime,
  getEventStatus,
  getEventStatusColor,
  setEditDialogOpen,
  setDeleteDialogOpen,
  setPointsDialogOpen,
  navigate,
  setEvent,
}: EventInformationProps) {
  const status = getEventStatus();

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <Badge classes={getEventStatusColor(status)} text={status}></Badge>
          {isManager && event.published === false && (
            <Badge
              classes="bg-yellow-100 text-yellow-800"
              text="Unpublished"
            ></Badge>
          )}
        </div>

        {isManager && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setEditDialogOpen(true)}
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Event Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Event Information</h3>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Location</h4>
            <p className="text-md">{event.location}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Start Time</h4>
            <p className="text-md">{formatDateTime(event.startTime)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">End Time</h4>
            <p className="text-md">{formatDateTime(event.endTime)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Capacity</h4>
            <p className="text-md">
              {event.numGuests}/{event.capacity || "∞"} guests
              {isEventFull && <span className="text-red-600 ml-2">(Full)</span>}
            </p>
          </div>

          {isManager && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Points</h4>
              <p className="text-md">
                {event.pointsAwarded || 0} awarded / {event.pointsRemain || 0}{" "}
                remaining
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-500">Organizers</h4>
            <ul className="list-disc pl-5">
              {event.organizers?.map((organizer) => (
                <li key={organizer.id}>
                  {organizer.name} ({organizer.utorid})
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Event Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Description</h3>
          <div className="bg-gray-50 p-4 rounded-md min-h-40">
            <p className="whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>
      </div>

      {/* Manager Actions Section */}
      {isManager && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Manager Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setPointsDialogOpen(true)}
              >
                <CoinsIcon className="h-4 w-4" />
                Award Points
              </Button>
            </div>
          </div>

          {/* User Management */}
          <EventUserManagement
            event={event}
            onSuccess={async () => {
              // Reload event details
              try {
                const response = await getEvent(event.id);
                setEvent(response);
              } catch (error) {
                console.error("Error reloading event details:", error);
              }
            }}
          />
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => navigate("/events")}>
          Back to Events
        </Button>

        {!isManager &&
          !isEventEnded &&
          (rsvpStatus ? (
            <Button
              variant="destructive"
              onClick={handleCancelRsvp}
              disabled={rsvpLoading || isEventEnded}
            >
              {rsvpLoading ? "Processing..." : "Cancel RSVP"}
            </Button>
          ) : (
            <Button
              onClick={handleRsvp}
              disabled={rsvpLoading || isEventFull || isEventEnded}
            >
              {rsvpLoading
                ? "Processing..."
                : isEventFull
                ? "Event Full"
                : "RSVP to Event"}
            </Button>
          ))}
      </div>
    </>
  );
}
