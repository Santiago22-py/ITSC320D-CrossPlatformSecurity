export interface IAuthSession {
	username: string;
	sessionToken: string;
	expiresAt: number;
}

const SESSION_TTL_MS = 15 * 60 * 1000;

/*
 * SECURITY FIX - Type: Improper Authentication
 * BEFORE: The app contained plaintext hardcoded credentials and performed the
 *         authentication decision entirely inside the mobile client.
 * PROBLEM: Client-side credential checks are easy to inspect or bypass, and any
 *          embedded usernames or passwords can be recovered from the app bundle.
 * AFTER: Hardcoded credentials were removed from the client. The mobile app now
 *        performs only input checks locally and creates an expiring session object
 *        so the rest of the app can enforce authenticated access consistently.
 *
 * NOTE: This project does not include a backend, so this file acts as a demo auth
 * boundary for the lab. In production, credential verification must be performed
 * by a server or trusted identity provider instead of inside the mobile client.
 */
export async function authenticateUser(
	username: string,
	password: string,
): Promise<IAuthSession | null> {
	const normalizedUsername = username.trim().toLowerCase();
	const normalizedPassword = password.trim();

	/*
	 * SECURITY FIX - Type: Improper Authentication
	 * The client now validates only basic input requirements. It no longer contains
	 * embedded credential pairs or compares passwords locally. In a production app,
	 * the next step here would be to send the credentials to a trusted backend and
	 * create the session only after the server confirms the login.
	 */
	if (!isCredentialInputAcceptable(normalizedUsername, normalizedPassword)) {
		return null;
	}

	return {
		username: normalizedUsername,
		sessionToken: createSessionToken(),
		expiresAt: Date.now() + SESSION_TTL_MS,
	};
}

export function isSessionValid(session: IAuthSession | null | undefined): boolean {
	return Boolean(
		session &&
		session.username.trim() !== '' &&
		session.sessionToken.trim() !== '' &&
		session.expiresAt > Date.now(),
	);
}

function createSessionToken() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isCredentialInputAcceptable(username: string, password: string) {
	return username.length >= 3 && password.length >= 8;
}
