import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventFilters } from "@/components/filters/EventFilters";
import { useNavigate } from "react-router-dom";
import { listEvents } from "@/lib/api/event";
import type { Event, listEventsQueryParams } from "@/lib/api/event";
import { checkRole } from "@/lib/api/util";
import { PlusCircle } from "lucide-react";
import { EventCreateForm } from "@/components/manageEvents/EventCreateForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<listEventsQueryParams>({
    showFull: false,
  });
  const [filterMode, setFilterMode] = useState<"partial" | "all">("partial");
  const [isManager, setIsManager] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      // check if user is manager or above
      const showAll = await checkRole("manager");
      setIsManager(showAll);
      if (showAll) setFilterMode("all");
      else setFilterMode("partial");

      // Ensure page is a positive integer
      const params: listEventsQueryParams = {
        page,
        limit: 10,
      };

      // Add filters to params if they exist, ensuring empty strings are not sent
      if (filters.name && filters.name.trim() !== "")
        params.name = filters.name;
      if (filters.location && filters.location.trim() !== "")
        params.location = filters.location;

      // Only add one of started or ended, not both (per API requirement)
      if (filters.started !== undefined) params.started = filters.started;
      else if (filters.ended !== undefined) params.ended = filters.ended;

      if (filters.showFull) params.showFull = filters.showFull;

      // manager/superuser only filter
      if (filters.published !== undefined && showAll)
        params.published = filters.published;

      console.log("Fetching with params:", params);

      const response = await listEvents(params);

      if (response.status === 401) {
        // Unauthorized - token expired
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (response.status === 400) {
        // Bad request - handle validation errors
        setError(response.error || "Invalid filter parameters");
        setEvents([]);
        setTotalPages(0);
        return;
      }

      setEvents(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / 10));
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
      setEvents([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, navigate]);

  // Create a separate effect for filters to avoid immediate fetch on page load
  useEffect(() => {
    // Skip initial render
    const timer = setTimeout(() => {
      fetchEvents();
    }, 100);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (newFilters: listEventsQueryParams) => {
    // If both started and ended are defined, only keep one
    if (newFilters.started !== undefined && newFilters.ended !== undefined) {
      // Prioritize started (arbitrarily)
      newFilters.ended = undefined;
    }
    console.log(newFilters);

    setFilters(newFilters);
    // Reset to first page when filters change
    setPage(1);
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

  const getEventStatus = (event: Event) => {
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

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const handleCreateEvent = (eventId: number) => {
    setCreateDialogOpen(false);
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Event List</CardTitle>
          {isManager && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <EventCreateForm
                  onSuccess={handleCreateEvent}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <EventFilters
            onFilterChange={handleFilterChange}
            filterMode={filterMode}
          />

          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-6">
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-6">
              <p>No events found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const status = getEventStatus(event);
                return (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getEventStatusColor(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                            {isManager && event.published === false && (
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                Unpublished
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1">
                            <h3 className="text-lg font-semibold">
                              {event.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Location: {event.location}
                            </p>
                            <p className="text-sm text-gray-600">
                              Start: {formatDateTime(event.startTime)}
                            </p>
                            <p className="text-sm text-gray-600">
                              End: {formatDateTime(event.endTime)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Capacity: {event.numGuests}/
                              {event.capacity || "∞"} guests
                            </p>
                            {isManager && (
                              <p className="text-sm text-gray-600">
                                Points: {event.pointsRemain || 0}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 0 && (
            <div className="mt-6 flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
