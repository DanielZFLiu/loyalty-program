import { fetchWrapper } from "./fetchWrapper";
import type { ResponseFields } from "./fetchWrapper";

/* ================================
   TypeScript Interfaces
================================ */

export interface Event {
    id: number;
    name: string;
    description?: string;
    location: string;
    startTime: string;
    endTime: string;
    capacity: number | null;
    // For manager/organizer view only:
    pointsRemain?: number;
    pointsAwarded?: number;
    published?: boolean;
    organizers?: Array<{ id: number; utorid: string; name: string }>;
    guests?: Array<{ id: number; utorid?: string; name?: string }>;
    // For regular view:
    numGuests?: number;
}

export interface CreateEventPayload {
    name: string;
    description: string;
    location: string;
    startTime: string; // ISO 8601 string
    endTime: string;   // ISO 8601 string
    capacity?: number | null;
    points: number;
}

export interface CreateEventResponse extends Event { }

export interface ListEventsResponse {
    count: number;
    results: Event[];
}

export interface UpdateEventPayload {
    name?: string;
    description?: string;
    location?: string;
    startTime?: string; // ISO 8601 string
    endTime?: string;   // ISO 8601 string
    capacity?: number | null;
    points?: number;    // only update-able by managers
    published?: boolean; // only settable to true by managers
}

export interface UpdateEventResponse {
    id: number;
    name: string;
    description?: string;
    location: string;
    startTime?: string;
    endTime?: string;
    capacity?: number | null;
    pointsRemain?: number;
    pointsAwarded?: number;
    published?: boolean;
}

export interface OrganizerPayload {
    utorid: string;
}

export interface OrganizerResponse {
    id: number;
    name: string;
    location: string;
    organizers: Array<{ id: number; utorid: string; name: string }>;
}

export interface GuestResponse {
    id: number;
    name: string;
    location: string;
    guestAdded: { id: number; utorid: string; name: string };
    numGuests: number;
}

export interface EventTransactionPayload {
    type: "event"; // must be "event"
    utorid?: string; // if omitted, awards all guests
    amount: number;
    remark?: string;
}

export interface EventTransactionResponse {
    id: number;
    recipient: string;
    awarded: number;
    type: string;
    relatedId: number;
    remark: string;
    createdBy: string;
}

/* ================================
   API Functions
================================ */

/**
 * Create a new event.
 * Only accessible to users with MANAGER privileges.
 */
export async function createEvent(
    payload: CreateEventPayload
): Promise<CreateEventResponse> {
    const response = await fetchWrapper("/events", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response;
}

export interface listEventsQueryParams {
    name?: string;
    location?: string;
    started?: boolean;
    ended?: boolean;
    showFull?: boolean;
    page?: number;
    limit?: number;
    published?: boolean;
}

/**
 * List events with optional filters.
 */
export async function listEvents(queryParams?: listEventsQueryParams): Promise<ListEventsResponse & ResponseFields> {
    // Build query string from provided parameters.
    const params = new URLSearchParams();
    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, String(value));
            }
        });
    }
    const url = `/events?${params.toString()}`;
    const response = await fetchWrapper(url, {
        method: "GET",
    });
    return response;
}

/**
 * Retrieve a single event by its id.
 */
export async function getEvent(eventId: number): Promise<Event & ResponseFields> {
    const response = await fetchWrapper(`/events/${eventId}`, {
        method: "GET",
    });
    return response;
}

/**
 * Update event details.
 * Only authorized users (manager or event organizer) can perform this action.
 */
export async function updateEvent(
    eventId: number,
    payload: UpdateEventPayload
): Promise<UpdateEventResponse> {
    const response = await fetchWrapper(`/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    return response;
}

/**
 * Delete an event.
 * Only managers can delete events and only if they have not been published.
 */
export async function deleteEvent(eventId: number): Promise<void> {
    await fetchWrapper(`/events/${eventId}`, {
        method: "DELETE",
    });
}

/**
 * Add an organizer to an event.
 */
export async function addEventOrganizer(
    eventId: number,
    payload: OrganizerPayload
): Promise<OrganizerResponse> {
    const response = await fetchWrapper(`/events/${eventId}/organizers`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response;
}

/**
 * Remove an organizer from an event.
 */
export async function removeEventOrganizer(
    eventId: number,
    userId: number
): Promise<void> {
    await fetchWrapper(`/events/${eventId}/organizers/${userId}`, {
        method: "DELETE",
    });
}

/**
 * Add a guest to an event by utorid.
 */
export async function addEventGuest(
    eventId: number,
    payload: { utorid: string }
): Promise<GuestResponse & ResponseFields> {
    const response = await fetchWrapper(`/events/${eventId}/guests`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response;
}

/**
 * Add the logged in user as a guest to an event.
 */
export async function addMyGuest(eventId: number): Promise<GuestResponse & ResponseFields> {
    const response = await fetchWrapper(`/events/${eventId}/guests/me`, {
        method: "POST",
    });
    return response;
}

/**
 * Remove the logged in user from an event.
 */
export async function removeMyGuest(eventId: number): Promise<ResponseFields> {
    const response = await fetchWrapper(`/events/${eventId}/guests/me`, {
        method: "DELETE",
    });
    return response;
}

/**
 * Remove a guest from an event.
 */
export async function removeEventGuest(
    eventId: number,
    userId: number
): Promise<void> {
    await fetchWrapper(`/events/${eventId}/guests/${userId}`, {
        method: "DELETE",
    });
}

/**
 * Create an event transaction (award points).
 * If `utorid` is provided, award points to that specific guest; if omitted, award to all guests.
 */
export async function createEventTransaction(
    eventId: number,
    payload: EventTransactionPayload
): Promise<EventTransactionResponse | EventTransactionResponse[]> {
    const response = await fetchWrapper(`/events/${eventId}/transactions`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response;
}
