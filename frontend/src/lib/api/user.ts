import { fetchWrapper } from './fetchWrapper';

/* ================================
   TypeScript Interfaces
================================ */

// Register User Interfaces
export interface RegisterUserInput {
    utorid: string;
    name: string;
    email: string;
}

export interface RegisterUserResponse {
    id: number;
    utorid: string;
    name: string;
    email: string;
    verified: boolean;
    expiresAt: string;
    resetToken: string;
}

// List Users Interfaces
export interface ListUsersQuery {
    name?: string;
    role?: string;
    verified?: boolean | string;
    activated?: boolean | string;
    page?: number;
    limit?: number;
}

export interface ListUsersResponse {
    count: number;
    results: User[];
}

// User Interfaces
export interface User {
    id: number;
    utorid: string;
    name: string;
    points: number;
    verified: boolean;
    promotions?: Promotion[];
    // Additional fields returned for managers/superusers
    email?: string;
    birthday?: string;
    role?: string;
    createdAt?: string;
    lastLogin?: string;
    avatarUrl?: string;
}

export interface Promotion {
    id: number;
    name: string;
    minSpending?: number;
    rate?: number;
    points: number;
}

// Update User Interfaces
export interface UpdateUserInput {
    email?: string;
    verified?: boolean; // if provided, must be set to true
    suspicious?: boolean;
    role?: string; // e.g., "CASHIER", "REGULAR", "MANAGER", "SUPERUSER"
}

export interface UpdateUserResponse {
    id: number;
    utorid: string;
    name: string;
    email?: string;
    verified?: boolean;
    suspicious?: boolean;
    role?: string;
}

/* ================================
         API Functions
================================ */

/**
 * Register a new user.
 * Requires that the request is authenticated with at least CASHIER role.
 *
 * @param data - { utorid, name, email }
 * @returns A promise resolving to the new user's details.
 */
export async function registerUser(data: RegisterUserInput): Promise<RegisterUserResponse> {
    return await fetchWrapper("/users", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * Retrieve a list of users.
 * Query parameters can be used to filter the results.
 *
 * @param query - Filters such as name, role, verified, activated, page, limit.
 * @returns A promise resolving to an object with count and array of users.
 */
export async function listUsers(query: ListUsersQuery = {}): Promise<ListUsersResponse> {
    // Convert the query object into a URL query string.
    const queryString = new URLSearchParams(query as any).toString();
    const endpoint = queryString ? `/users?${queryString}` : "/users";
    return await fetchWrapper(endpoint, {
        method: "GET",
    });
}

/**
 * Retrieve details of a specific user.
 *
 * @param userId - The id of the user.
 * @returns A promise resolving to the user details.
 */
export async function getUser(userId: number): Promise<User> {
    return await fetchWrapper(`/users/${userId}`, {
        method: "GET",
    });
}

/**
 * Update a specific user's information.
 * Fields allowed: email, verified (must be true if provided), suspicious, role.
 *
 * @param userId - The id of the user to update.
 * @param data - Object containing the fields to update.
 * @returns A promise resolving to the updated user details.
 */
export async function updateUser(userId: number, data: UpdateUserInput): Promise<UpdateUserResponse> {
    const response = await fetchWrapper(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
    
    if ('error' in response) {
        throw new Error(response.error);
    }
    
    return response;
}
