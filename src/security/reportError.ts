/*
SECURITY FIX:
Centralized error reporting to prevent leaking internal error details (stacks, tokens, user data).
Call sites should pass only a safe, generic context string and never pass the raw error object.
*/
export function reportError() {
	/*
	SECURITY FIX:
	Log only safe, generic messages. Avoid logging passwords/tokens/notes or full stack traces.
	This keeps logs useful for debugging without creating an information-leak risk.
	*/
	if (typeof __DEV__ !== 'undefined' && __DEV__) {
		console.error('Action failed');
	}
}
