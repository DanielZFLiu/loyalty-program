// @/lib/api/promotion.ts: 
import { fetchWrapper } from "./fetchWrapper";

/* ================================
   TypeScript Interfaces
================================ */

export interface Promotion {
    id: number;
    name: string;
    description?: string;
    type: "automatic" | "one-time";
    startTime?: string;
    endTime: string;
    minSpending?: number | null;
    rate?: number | null;
    points: number;
}

export interface PromotionListResponse {
    count: number;
    results: Promotion[];
}

export interface CreatePromotionPayload {
    name: string;
    description: string;
    type: "automatic" | "one-time";
    startTime: string; // ISO 8601 formatted string
    endTime: string;   // ISO 8601 formatted string
    minSpending?: number;
    rate?: number;
    points?: number;
}

export interface UpdatePromotionPayload {
    name?: string;
    description?: string;
    type?: "automatic" | "one-time";
    startTime?: string;
    endTime?: string;
    minSpending?: number;
    rate?: number;
    points?: number;
}

export interface GetPromotionsQuery {
    name?: string;
    type?: "automatic" | "one-time";
    page?: number;
    limit?: number;
    started?: boolean;
    ended?: boolean;
}

/* ================================
   Helper Functions
================================ */

/**
 * Builds a query string from an object.
 * Converts boolean values and ignores undefined or null values.
 */
function buildQueryString(query: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const key in query) {
        if (query[key] !== undefined && query[key] !== null) {
            params.append(key, String(query[key]));
        }
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

/* ================================
   API Functions
================================ */

/**
 * Create a new promotion.
 *
 * @param payload - Data for creating a new promotion.
 * @returns The created promotion.
 */
export async function createPromotion(
    payload: CreatePromotionPayload
): Promise<Promotion> {
    const promotion = await fetchWrapper("/promotions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return promotion;
}

/**
 * Get a list of promotions.
 *
 * @param query - Optional query parameters to filter promotions.
 * @returns An object containing the total count and the list of promotions.
 */
export async function getPromotions(
    query: GetPromotionsQuery = {}
): Promise<PromotionListResponse> {
    const queryString = buildQueryString(query);
    const data = await fetchWrapper(`/promotions${queryString}`, {
        method: "GET",
    });
    return data;
}

/**
 * Get the details of a single promotion.
 *
 * @param promotionId - The promotion id.
 * @returns The promotion details.
 */
export async function getPromotion(
    promotionId: number
): Promise<Promotion> {
    const promotion = await fetchWrapper(`/promotions/${promotionId}`, {
        method: "GET",
    });
    return promotion;
}

/**
 * Update an existing promotion.
 *
 * @param promotionId - The promotion id.
 * @param payload - The fields to update.
 * @returns The updated promotion data.
 */
export async function updatePromotion(
    promotionId: number,
    payload: UpdatePromotionPayload
): Promise<Promotion> {
    const updatedPromotion = await fetchWrapper(`/promotions/${promotionId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    return updatedPromotion;
}

/**
 * Delete a promotion.
 *
 * @param promotionId - The promotion id.
 */
export async function deletePromotion(
    promotionId: number
): Promise<void> {
    await fetchWrapper(`/promotions/${promotionId}`, {
        method: "DELETE",
    });
}
