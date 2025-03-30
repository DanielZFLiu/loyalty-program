import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { EventFilters } from '../components/EventFilters';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: number;
  name: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  numGuests: number;
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    name: undefined,
    location: undefined,
    started: undefined,
    ended: undefined,
    showFull: false,
  });
  const navigate = useNavigate();

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const params = new URLSearchParams({
        page: String(page),
        limit: String(10),
      });

      // Add filters to params if they exist, ensuring empty strings are not sent
      if (filters.name && filters.name.trim() !== '') params.append('name', filters.name);
      if (filters.location && filters.location.trim() !== '') params.append('location', filters.location);
      
      // Only add one of started or ended, not both (per API requirement)
      if (filters.started !== undefined) {
        params.append('started', String(filters.started));
      } else if (filters.ended !== undefined) {
        params.append('ended', String(filters.ended));
      }
      
      // Only add showFull if it's true (since default is false)
      if (filters.showFull === true) {
        params.append('showFull', 'true');
      }

      console.log('Fetching with params:', params.toString());
      
      const response = await fetch(
        `http://localhost:3000/events?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        // Unauthorized - token expired
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (response.status === 400) {
        // Bad request - handle validation errors
        const errorData = await response.json();
        setError(errorData.message || 'Invalid filter parameters');
        setEvents([]);
        setTotalPages(0);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10));
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
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

  const handleFilterChange = (newFilters: any) => {
    // If both started and ended are defined, only keep one
    if (newFilters.started !== undefined && newFilters.ended !== undefined) {
      // Prioritize started (arbitrarily)
      newFilters.ended = undefined;
    }
    
    setFilters(newFilters);
    // Reset to first page when filters change
    setPage(1);
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

  const getEventStatus = (event: Event) => {
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

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Event List</CardTitle>
        </CardHeader>
        <CardContent>
          <EventFilters onFilterChange={handleFilterChange} />

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
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getEventStatusColor(status)}`}
                          >
                            {status}
                          </span>
                          <div className="mt-2 space-y-1">
                            <h3 className="text-lg font-semibold">{event.name}</h3>
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
                              Capacity: {event.numGuests}/{event.capacity} guests
                            </p>
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