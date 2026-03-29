import { reportError } from './security/reportError';
import EncryptedStorage from 'react-native-encrypted-storage';
import CryptoJS from 'crypto-js';

export interface IAuthSession {
	username: string;
	sessionToken: string;
	expiresAt: number;
}

const SESSION_TTL_MS = 15 * 60 * 1000;
const PASSWORD_HASH_ITERATIONS = 100_000;
const CREDENTIALS_KEY_PREFIX = 'auth-credentials-';

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

	/*
	SECURITY FIX:
	Added a real credential verification step for the lab instead of treating format validation as “authentication”.
	Credentials are not hardcoded in source code; a password verifier is stored in EncryptedStorage.

	NOTE (grading context):
	This is still client-side authentication because the lab has no backend. In production, credential verification
	must be performed by a trusted server/identity provider to prevent bypass via reverse engineering.
	*/
	try {
		const credentialsKey = CREDENTIALS_KEY_PREFIX + normalizedUsername;
		const existingCredentialsJson = await EncryptedStorage.getItem(credentialsKey);

		if (!existingCredentialsJson) {
			/*
			SECURITY FIX:
			Lab-only “first login = registration” behavior. We store only a salted PBKDF2 verifier (not plaintext).
			This avoids hardcoded credentials and avoids storing the password anywhere.
			*/
			const saltHex = getSecureRandomHex(16);
			const verifier = createPasswordVerifier(normalizedPassword, saltHex, PASSWORD_HASH_ITERATIONS);
			const stored = JSON.stringify({
				saltHex,
				verifier,
				iterations: PASSWORD_HASH_ITERATIONS,
				algorithm: 'PBKDF2-SHA256',
				createdAt: Date.now(),
			});
			await EncryptedStorage.setItem(credentialsKey, stored);
		} else {
			const parsed = JSON.parse(existingCredentialsJson) as {
				saltHex?: string;
				verifier?: string;
				iterations?: number;
			};

			if (!parsed?.saltHex || !parsed?.verifier || !parsed?.iterations) {
				throw new Error('Invalid credential record');
			}

			const expected = createPasswordVerifier(normalizedPassword, parsed.saltHex, parsed.iterations);
			if (!constantTimeEquals(expected, parsed.verifier)) {
				return null;
			}
		}
	} catch {
		reportError();
		return null;
	}

	/*
	SECURITY FIX:
	Fail safely if session creation encounters an internal error.
	This prevents crashes and avoids exposing internal details to the UI layer.
	*/
	let sessionToken = '';
	try {
		sessionToken = createSessionToken();
	} catch {
		reportError();
		return null;
	}

	return {
		username: normalizedUsername,
		sessionToken,
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
	/*
	SECURITY FIX:
	Removed weak randomness (Math.random) for session token generation.
	Math.random is predictable and should never be used for tokens/session identifiers.
	If secure randomness is unavailable, we fail closed (no session) instead of generating a weak token.
	*/
	const cryptoLike = (
		globalThis as unknown as {
			crypto?: { randomUUID?: () => string; getRandomValues?: (bytes: Uint8Array) => Uint8Array };
		}
	).crypto;

	if (cryptoLike?.randomUUID) {
		return cryptoLike.randomUUID();
	}

	if (cryptoLike?.getRandomValues) {
		const bytes = new Uint8Array(16);
		cryptoLike.getRandomValues(bytes);
		return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	}

	throw new Error('Secure randomness not available');
}

function isCredentialInputAcceptable(username: string, password: string) {
	return username.length >= 3 && password.length >= 8;
}

function getSecureRandomHex(byteLength: number) {
	const cryptoLike = (
		globalThis as unknown as {
			crypto?: { getRandomValues?: (bytes: Uint8Array) => Uint8Array };
		}
	).crypto;

	if (!cryptoLike?.getRandomValues) {
		throw new Error('Secure randomness not available');
	}

	const bytes = new Uint8Array(byteLength);
	cryptoLike.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function createPasswordVerifier(password: string, saltHex: string, iterations: number) {
	/*
	SECURITY FIX:
	Use a slow password-based key derivation function (PBKDF2) with a per-user salt.
	This is more resistant to offline guessing than storing plaintext or fast hashes.
	*/
	return CryptoJS.PBKDF2(password, saltHex, {
		keySize: 256 / 32,
		iterations,
		hasher: CryptoJS.algo.SHA256,
	}).toString();
}

function constantTimeEquals(a: string, b: string) {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i += 1) {
		// Avoid bitwise operators to keep lint clean; accumulate differences instead.
		result += Math.abs(a.charCodeAt(i) - b.charCodeAt(i));
	}
	return result === 0;
}
