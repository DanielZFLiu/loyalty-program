import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EventEditForm } from "@/components/manageEvents/EventEditForm";
import {
  deleteEvent,
  createEventTransaction,
  getEvent,
  type Event,
  type EventTransactionPayload,
} from "@/lib/api/event";

interface EventActionDialogsProps {
  event: Event;
  isManager?: boolean;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  pointsDialogOpen: boolean;
  setPointsDialogOpen: (open: boolean) => void;
  onDeleteSuccess: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  setEvent: (event: Event) => void;
  eventId: number;
  navigate: (path: string) => void;
}

export function EventActionDialogs({
  event,
  isManager = false,
  editDialogOpen,
  setEditDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  pointsDialogOpen,
  setPointsDialogOpen,
  onDeleteSuccess,
  onError,
  onSuccess,
  setEvent,
  eventId,
  navigate,
}: EventActionDialogsProps) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [pointsRemark, setPointsRemark] = useState<string>("");
  const [pointsLoading, setPointsLoading] = useState(false);
  const [specificUser, setSpecificUser] = useState<string>("");
  const [awardAll, setAwardAll] = useState(true);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleEditSuccess = async () => {
    setEditDialogOpen(false);

    // Reload event details
    try {
      const response = await getEvent(eventId);
      setEvent(response);
      onSuccess("Event details updated successfully!");
    } catch (error) {
      console.error("Error reloading event details:", error);
      onError("Event was updated but failed to reload details.");
    }
  };

  const handleDeleteEvent = async () => {
    setDeleteLoading(true);
    
    // Only managers should be able to delete events
    if (!isManager) {
      onError("You don't have permission to delete this event. Only managers can delete events.");
      setDeleteLoading(false);
      return;
    }

    try {
      await deleteEvent(eventId);
      setDeleteDialogOpen(false);
      onSuccess("Event deleted successfully!");

      // Signal successful deletion
      onDeleteSuccess();

      // Navigate back to events list after a short delay
      setTimeout(() => {
        navigate("/events");
      }, 1500);
    } catch (error) {
      console.error("Error deleting event:", error);
      onError("Failed to delete event. Please try again.");
      setDeleteLoading(false);
    }
  };

  const handleAwardPoints = async () => {
    setPointsLoading(true);
    // Create a state variable for the error message  
    if (pointsAmount <= 0) {
      setDialogError("Points amount must be greater than zero.");
      setPointsLoading(false);
      return;
    }
  
    try {
      const payload: EventTransactionPayload = {
        type: "event",
        amount: pointsAmount,
        remark: pointsRemark || undefined,
      };
  
      // If not awarding to all, include the specific user's utorid
      if (!awardAll && specificUser.trim()) {
        payload.utorid = specificUser.trim();
      }
  
      const response = await createEventTransaction(eventId, payload);
      
      // Check if the response contains an error
      if (response.error) {
        setDialogError(response.error);
        setPointsLoading(false);
        return;
      }
  
      // Reload event details to get updated points
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
  
      setDialogError(null); // Clear any errors
      setPointsDialogOpen(false);
      onSuccess(`Points awarded successfully!`);
  
      // Reset form
      setPointsAmount(0);
      setPointsRemark("");
      setSpecificUser("");
      setAwardAll(true);
    } catch (error) {
      console.error("Error awarding points:", error);
      if (error instanceof Error && error.message.includes("not enough remaining points")) {
        setDialogError("Not enough remaining points to complete this transaction.");
      } else {
        setDialogError("Failed to award points. Please try again.");
      }
    } finally {
      setPointsLoading(false);
    }
  };

  return (
    <>
      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">            
          <DialogTitle>Edit Event</DialogTitle>
          <EventEditForm
            event={event}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Points Dialog */}
      <Dialog 
        open={pointsDialogOpen} 
        onOpenChange={(open) => {
          setPointsDialogOpen(open);
          if (!open) setDialogError(null); // Clear error when dialog is closed
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Points</DialogTitle>
            <DialogDescription>
              Award points to participants of this event.
            </DialogDescription>
            
            {/* Error display inside dialog header */}
            {dialogError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                {dialogError}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points-amount">Points Amount*</Label>
              <Input
                id="points-amount"
                type="number"
                min="1"
                required
                value={pointsAmount || ""}
                onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                placeholder="Number of points to award"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points-remark">Remark (Optional)</Label>
              <Textarea
                id="points-remark"
                value={pointsRemark}
                onChange={(e) => setPointsRemark(e.target.value)}
                placeholder="Add a note for this points transaction"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="award-all"
                  checked={awardAll}
                  onChange={() => setAwardAll(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="award-all">Award to all guests</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="award-specific"
                  checked={!awardAll}
                  onChange={() => setAwardAll(false)}
                  className="h-4 w-4"
                />
                <Label htmlFor="award-specific">Award to specific user</Label>
              </div>
            </div>

            {!awardAll && (
              <div className="space-y-2">
                <Label htmlFor="specific-user">UTORid*</Label>
                <Input
                  id="specific-user"
                  value={specificUser}
                  onChange={(e) => setSpecificUser(e.target.value)}
                  placeholder="Enter UTORid"
                  required={!awardAll}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPointsDialogOpen(false)}
              disabled={pointsLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAwardPoints}
              disabled={
                pointsLoading ||
                pointsAmount <= 0 ||
                (!awardAll && !specificUser.trim())
              }
            >
              {pointsLoading ? "Processing..." : "Award Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
