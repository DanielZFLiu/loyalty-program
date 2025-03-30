import { fetchWrapper } from './fetchWrapper';

/* ================================
   TypeScript Interfaces
================================ */

interface LoginResponse {
    token: string;
    expiresAt: string;
}

interface ResetTokenResponse {
    resetToken: string;
    expiresAt: string;
}

interface MessageResponse {
    message: string;
}

/* ================================
   API Functions
================================ */

/**
 * Logs in the user with provided credentials.
 * On success, stores the token and expiration in localStorage.
 *
 * @param utorid - The user's utorid.
 * @param password - The user's password.
 * @returns A promise resolving to the token and expiration date.
 */
export async function login(utorid: string, password: string): Promise<LoginResponse> {
    const response = await fetchWrapper("/auth/tokens", {
        method: "POST",
        body: JSON.stringify({ utorid, password }),
    });

    // Store the token and its expiration in localStorage
    localStorage.setItem("token", response.token);
    localStorage.setItem("tokenExpiresAt", response.expiresAt);

    return response;
}

/**
 * Requests a password reset token for the given utorid.
 *
 * @param utorid - The user's utorid.
 * @returns A promise resolving to the reset token and its expiration date.
 */
export async function requestPasswordReset(utorid: string): Promise<ResetTokenResponse> {
    return await fetchWrapper("/auth/resets", {
        method: "POST",
        body: JSON.stringify({ utorid }),
    });
}

/**
 * Resets the user's password using the provided reset token.
 *
 * @param resetToken - The reset token provided from the password reset request.
 * @param utorid - The user's utorid.
 * @param password - The new password that meets complexity requirements.
 * @returns A promise resolving to a message confirming the password reset.
 */
export async function resetPassword(resetToken: string, utorid: string, password: string): Promise<MessageResponse> {
    return await fetchWrapper(`/auth/resets/${resetToken}`, {
        method: "POST",
        body: JSON.stringify({ utorid, password }),
    });
}
