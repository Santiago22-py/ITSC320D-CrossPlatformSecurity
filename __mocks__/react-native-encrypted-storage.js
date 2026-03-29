/*
SECURITY FIX:
Mock encrypted storage in tests to prevent failures when the native module is unavailable.
This mock does not log or expose stored values; it only provides deterministic behavior for unit tests.
*/
const store = new Map();

module.exports = {
	setItem: jest.fn(async (key, value) => {
		store.set(String(key), String(value));
	}),
	getItem: jest.fn(async (key) => {
		return store.has(String(key)) ? store.get(String(key)) : null;
	}),
	removeItem: jest.fn(async (key) => {
		store.delete(String(key));
	}),
	clear: jest.fn(async () => {
		store.clear();
	}),
};

