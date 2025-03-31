import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { addMyGuest, getEvent, removeMyGuest } from '@/lib/api/event';
import type { Event as EventDetail } from '@/lib/api/event';

interface Rsvp {
  id: number;
  utorid: string;
  name: string;
}

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<boolean>(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Function to check RSVP status by attempting to RSVP
  const checkRsvpStatus = async () => {
    const data = await addMyGuest(Number(eventId));

    if (data.status == 400) { // already rsvped
      setRsvpStatus(true);
      return;
    }
    else if (data.error) {
      setRsvpStatus(false);
      return;
    }
    else {
      setEvent(prev => prev ? { ...prev, numGuests: data.numGuests } : null);

      // Now cancel this RSVP since we were just checking
      const cancelResponse = await removeMyGuest(Number(eventId));

      if (!cancelResponse.error) setRsvpStatus(false);
      else setRsvpStatus(true);
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch event details
        const response = await getEvent(Number(eventId));

        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (response.status === 404) {
          setError('Event not found or not published.');
          setLoading(false);
          return;
        }

        setEvent(response);

        // Now try to RSVP to see if we're already registered
        await checkRsvpStatus();
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details. Please try again later.');
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
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (response.status === 410) {
        setError('This event is full or has already ended.');
        return;
      }

      if (response.status === 400) {
        // Already RSVP'd
        setRsvpStatus(true);
        setStatusMessage("You've already RSVP'd to this event!");
        return;
      }

      // Update the event with new guest count
      setEvent(prev => prev ? { ...prev, numGuests: response.numGuests } : null);
      setRsvpStatus(true);
      setStatusMessage("You've successfully RSVP'd to this event!");
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      setError('Failed to RSVP. Please try again later.');
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
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (response.status === 410) {
        setError('You cannot cancel RSVP for an event that has already ended.');
        return;
      }

      if (response.status === 404) {
        // Not RSVP'd
        setRsvpStatus(false);
        setStatusMessage("You haven't RSVP'd to this event yet.");
        return;
      }

      // Update the event with reduced guest count
      setEvent(prev => prev ? { ...prev, numGuests: prev.numGuests? prev.numGuests - 1 : 0 } : null);
      setRsvpStatus(false);
      setStatusMessage("Your RSVP has been cancelled.");
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      setError('Failed to cancel RSVP. Please try again later.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventStatus = () => {
    if (!event) return '';

    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (now < startTime) return 'Upcoming';
    if (now >= startTime && now <= endTime) return 'Ongoing';
    return 'Completed';
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'Ongoing':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              {error || 'Event not found'}
            </div>
            <Button
              className="mt-4"
              onClick={() => navigate('/events')}
            >
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getEventStatus();
  const isEventFull = event.capacity? ((event.numGuests? event.numGuests : 0) >= event.capacity) : false;
  const isEventEnded = status === 'Completed';

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            <Badge classes={getEventStatusColor(status)} text={status}></Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" classes="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {statusMessage && (
            <Alert variant="default" classes="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {event.numGuests}/{event.capacity} guests
                  {isEventFull && <span className="text-red-600 ml-2">(Full)</span>}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Organizers</h4>
                <ul className="list-disc pl-5">
                  {event.organizers?.map(organizer => (
                    <li key={organizer.id}>{organizer.name} ({organizer.utorid})</li>
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
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </Button>

          {!isEventEnded && (
            rsvpStatus ? (
              <Button
                variant="destructive"
                onClick={handleCancelRsvp}
                disabled={rsvpLoading || isEventEnded}
              >
                {rsvpLoading ? 'Processing...' : 'Cancel RSVP'}
              </Button>
            ) : (
              <Button
                onClick={handleRsvp}
                disabled={rsvpLoading || isEventFull || isEventEnded}
              >
                {rsvpLoading ? 'Processing...' : isEventFull ? 'Event Full' : 'RSVP to Event'}
              </Button>
            )
          )}
        </CardFooter>
      </Card>
    </div>
  );
}