import { fetchWrapper } from './fetchWrapper';

/* ================================
   TypeScript Interfaces
================================ */

// Promotion interface (minimal properties; extend as needed)
export interface Promotion {
    id: number;
    name: string;
    description: string;
    type: string; // "AUTOMATIC" | "ONE_TIME"
    startTime: string;
    endTime: string;
    minSpending?: number;
    rate?: number;
    points: number;
    createdAt: string;
}

// User interface as returned from GET /users/me and PATCH /users/me
export interface User {
    id: number;
    utorid: string;
    name: string;
    email: string;
    birthday: string | null;
    role: string;
    points: number;
    createdAt: string;
    lastLogin: string | null;
    verified: boolean;
    avatarUrl: string | null;
    promotions: Promotion[];
}

// Transaction interface for transactions list
export interface Transaction {
    id: number;
    type: string;
    spent?: number;
    amount: number;
    promotionIds: number[];
    remark: string;
    createdBy: string | null;
    relatedId?: number;
}

// Response for listing transactions
export interface GetTransactionsResponse {
    count: number;
    results: Transaction[];
}

/* ================================
   API Functions
================================ */

/**
 * Retrieves current user information.
 *
 * GET /users/me
 */
export async function getMe(): Promise<User> {
    return await fetchWrapper("/users/me", { method: "GET" });
}

/**
 * Updates current user's info.
 *
 * PATCH /users/me
 * 
 * If an avatar File is provided, the request is sent as multipart/form-data.
 * Otherwise, the data is sent as JSON.
 *
 * @param data - Object containing optional name, email, birthday (YYYY-MM-DD) and avatar (File)
 */
export async function updateMe(data: {
    name?: string;
    email?: string;
    birthday?: string;
    avatar?: File;
}): Promise<User> {
    if (data.avatar) {
        // When uploading a file, use FormData and let the browser set the Content-Type header
        const formData = new FormData();
        if (data.name) formData.append("name", data.name);
        if (data.email) formData.append("email", data.email);
        if (data.birthday) formData.append("birthday", data.birthday);
        if(data.avatar) formData.append("avatar", data.avatar);

        return await fetchWrapper("/users/me", {
            method: "PATCH",
            body: formData,
        });
    } else {
        // Otherwise, send as JSON
        return await fetchWrapper("/users/me", {
            method: "PATCH",
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                birthday: data.birthday,
            }),
        });
    }
}

/**
 * Updates the current user's password.
 *
 * PATCH /users/me/password
 *
 * @param oldPassword - The current password.
 * @param newPassword - The new password (8-20 characters, including uppercase, lowercase, number, and special character).
 */
export async function updatePassword(
    oldPassword: string,
    newPassword: string
): Promise<{ message: string }> {
    return await fetchWrapper("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ old: oldPassword, new: newPassword }),
    });
}

/**
 * Creates a new redemption transaction.
 *
 * POST /users/me/transactions
 *
 * @param amount - The point amount to redeem.
 * @param remark - Optional remark.
 */
export async function createRedemptionTransaction(
    amount: number,
    remark?: string
): Promise<any> {
    return await fetchWrapper("/users/me/transactions", {
        method: "POST",
        body: JSON.stringify({ type: "redemption", amount, remark }),
    });
}

/**
 * Options interface for filtering transactions.
 */
export interface ListTransactionsOptions {
    type?: string;
    relatedId?: number;
    promotionId?: number;
    amount?: number;
    operator?: "gte" | "lte";
    page?: number;
    limit?: number;
}

/**
 * Lists transactions for the current user.
 *
 * GET /users/me/transactions
 *
 * @param options - Optional filters and pagination settings.
 */
export async function listTransactions(
    options: ListTransactionsOptions = {}
): Promise<GetTransactionsResponse> {
    const query = new URLSearchParams();
    Object.keys(options).forEach((key) => {
        const value = options[key as keyof ListTransactionsOptions];
        if (value !== undefined) {
            query.append(key, String(value));
        }
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    return await fetchWrapper(`/users/me/transactions${qs}`, { method: "GET" });
}
