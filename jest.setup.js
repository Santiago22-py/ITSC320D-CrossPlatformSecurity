/*
SECURITY FIX:
Tests run in a Node/Jest environment where native modules may be unavailable.
We mock encrypted storage so unit tests can run without accessing native keychain/keystore APIs.
*/
/* eslint-env jest */
jest.mock('react-native-encrypted-storage');
