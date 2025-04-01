import { fetchWrapper } from './fetchWrapper'

/* ================================
   TypeScript Interfaces
================================ */
export interface PurchaseTransactionResponse {
    id: number;
    utorid: string;
    type: "purchase";
    spent: number;
    earned: number;
    remark: string;
    promotionIds: number[];
    createdBy: string;
}

export interface AdjustmentTransactionResponse {
    id: number;
    utorid: string;
    amount: number;
    type: "adjustment";
    relatedId: number;
    remark: string;
    promotionIds: number[];
    createdBy: string;
}

export interface TransactionSummary {
    id: number;
    utorid: string | null;
    amount: number;
    type: string;
    spent?: number;
    promotionIds: number[];
    suspicious: boolean;
    remark: string;
    relatedId?: number;
    createdBy: string | null;
}

export interface ListTransactionsResponse {
    count: number;
    results: TransactionSummary[];
}

export interface TransferTransactionResponse {
    id: number;
    sender: string;
    recipient: string;
    type: "transfer";
    sent: number;
    remark: string;
    createdBy: string;
}

export interface RedemptionTransactionResponse {
    id: number;
    utorid: string | null;
    type: "redemption";
    processedBy: string | null;
    redeemed: number;
    remark: string;
    createdBy: string | null;
}

/* ================================
   Helper function to build query strings
================================ */
function buildQueryString(params: { [key: string]: any }): string {
    const query = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    return query ? `?${query}` : '';
}

/* ================================
   API Functions
================================ */

/**
 * Creates a purchase transaction.
 *
 * @param utorid - The utorid of the customer making the purchase.
 * @param spent - The dollar amount spent.
 * @param promotionIds - Array of promotion ids to apply (optional).
 * @param remark - Additional remark (optional).
 * @returns The created purchase transaction.
 */
export async function createPurchaseTransaction(
    utorid: string,
    spent: number,
    promotionIds?: number[],
    remark?: string
): Promise<PurchaseTransactionResponse> {
    const payload = {
        utorid,
        type: "purchase",
        spent,
        promotionIds,
        remark
    };

    return await fetchWrapper('/transactions', {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

/**
 * Creates an adjustment transaction.
 *
 * @param utorid - The utorid of the customer whose transaction is adjusted.
 * @param amount - The point amount adjusted.
 * @param relatedId - The id of the related transaction.
 * @param promotionIds - Array of promotion ids to apply (optional).
 * @param remark - Additional remark (optional).
 * @returns The created adjustment transaction.
 */
export async function createAdjustmentTransaction(
    utorid: string,
    amount: number,
    relatedId: number,
    promotionIds?: number[],
    remark?: string
): Promise<AdjustmentTransactionResponse> {
    const payload = {
        utorid,
        type: "adjustment",
        amount,
        relatedId,
        promotionIds,
        remark
    };

    return await fetchWrapper('/transactions', {
        method: "POST",
        body: JSON.stringify(payload)
    });
}


export interface ListTransactionsOptions {
    name?: string;
    createdBy?: string;
    suspicious?: boolean;
    promotionId?: number;
    type?: string;
    relatedId?: number;
    amount?: number;
    operator?: "gte" | "lte";
    page?: number;
    limit?: number;
}

/**
 * Lists transactions with optional filters.
 *
 * @param filters - Object containing filter options.
 * @returns The count and list of matching transactions.
 */
export async function listTransactions(filters: ListTransactionsOptions): Promise<ListTransactionsResponse> {
    const queryString = buildQueryString(filters);
    return await fetchWrapper(`/transactions${queryString}`, {
        method: "GET"
    });
}

/**
 * Retrieves a single transaction by id.
 *
 * @param transactionId - The transaction id.
 * @returns The transaction details.
 */
export async function getTransaction(transactionId: number): Promise<TransactionSummary> {
    return await fetchWrapper(`/transactions/${transactionId}`, {
        method: "GET"
    });
}

/**
 * Updates the suspicious flag of a transaction.
 *
 * @param transactionId - The transaction id.
 * @param suspicious - The new suspicious flag.
 * @returns The updated transaction details.
 */
export async function updateTransactionSuspicious(
    transactionId: number,
    suspicious: boolean
): Promise<TransactionSummary> {
    return await fetchWrapper(`/transactions/${transactionId}/suspicious`, {
        method: "PATCH",
        body: JSON.stringify({ suspicious })
    });
}

/**
 * Creates a transfer transaction.
 *
 * @param userId - The recipient's user id.
 * @param amount - The point amount to transfer.
 * @param remark - Additional remark (optional).
 * @returns The created transfer transaction.
 */
export async function createTransferTransaction(
    userId: number,
    amount: number,
    remark?: string
): Promise<TransferTransactionResponse> {
    const payload = {
        type: "transfer",
        amount,
        remark
    };

    return await fetchWrapper(`/users/${userId}/transactions`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

/**
 * Processes a redemption transaction.
 *
 * @param transactionId - The redemption transaction id.
 * @returns The processed redemption transaction.
 */
export async function processRedemptionTransaction(
    transactionId: number
): Promise<RedemptionTransactionResponse> {
    return await fetchWrapper(`/transactions/${transactionId}/processed`, {
        method: "PATCH",
        body: JSON.stringify({ processed: true })
    });
}
