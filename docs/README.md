# Cross-Platform Security Lab

### Team Members:  

- Denver Timlick
- Jasleen Kaur
- Joao Santiago
- Naman Khanna
- Sehajbir Kaur

## 1. Introduction
This lab focuses on identifying and mitigating common mobile security issues in a cross-platform React Native application. The app provides a simple login flow and a “Math Notes” feature where users can store and evaluate mathematical expressions.

The goal of the assessment was to review the codebase for the specified vulnerability categories, document the risks, and apply secure mitigations that reduce information leakage and unsafe behavior.

## 2. Security Assessment
For this lab, we have performed a securiy assessment to try and find security vulnerabilities across the code, following on the following: 

- Insecure data storage
- Improper authentication
- Code injection
- Insufficient input validation
- Insecure coding practices

For each type, we analyzed the source code of the application and applied the appropriate mitigations

### 2.1 Methodology (How issues were found)
- Manual code review of the login, notes, and evaluation flows
- Searched for insecure patterns such as `eval(...)`, plaintext credential handling, unsafe logging, and unhandled exceptions
- Verified fixes by running lint/tests and exercising key UI flows (login, load notes, add note, evaluate expression)

### 2.2 Findings Summary
| Category | Where found | Why it mattered | Fix summary |
|---|---|---|---|
| Insecure Data Storage | `src/Notes.tsx` | Notes persisted without encryption; password previously used in storage key | Store notes using encrypted storage and remove password from keys |
| Improper Authentication | `src/Login.tsx`, `src/auth.ts`, `src/Notes.tsx` | Hardcoded credentials / weak client-side checks can be bypassed | Centralize auth, remove hardcoded creds, verify credentials locally for the lab, enforce session checks |
| Code Injection | `src/components/Note.tsx` | `eval()` allowed arbitrary code execution | Replace `eval()` with a safe parser/evaluator |
| Input Validation | `src/Login.tsx`, `src/Notes.tsx` | Unvalidated input can crash app or cause unsafe behavior | Add allowlist validation and length checks |
| Insecure Coding Practices | Multiple | Error/stack leakage and unsafe logging patterns | Centralize safe error handling and remove sensitive/debug logging |

## 3. Vulnerabilities and Fixes

### 3.1. Insecure Data Storage
Author: Joao Santiago

###### 3.1.1 Vulnerability Description  
In this vulnerability, I found out that the application was storing notes using AsyncStorage, which is unencrypted [1]. The storage key was built using both the usernamen and password of the user as follows:

```jsx
const suffix = this.props.route.params.user.username + '-' + this.props.route.params.user.password;
const value = await AsyncStorage.getItem('notes-' + suffix);
```

Which could produce keys such as ```notes-joao-Password123```, considering that passwords are sensitive data, and even thought the key was not stored inside the note data itself, they should not be stored in an unencrypted method.  
In a case like this, someone could easily retrieve that password if someone were to inspect the storage of the phone.

###### 3.1.2 Security Risks

The Android Developer guidelines advices against storing user passwords in the local storage [2], and the OWASP Mobile top 10 also mentions that the lack of encryption, and storing sensitive data as plain text allows for easy access and exposion to unauthorized extraction/manipulation [3]. Taking that into consideration, storing passwords using an unencrypted system such as AsyncStorage[1] is not good practice.

###### 3.1.3 Implemented Fix 
The fix implemented for this issue includes two improvements:
1) Removed the password from key generation and now uses only the non-sensitive username.
2) Switched persistence from AsyncStorage (unencrypted) to EncryptedStorage (encrypted at rest).

This can be seen in the ```getStoredNotes()``` function:

```jsx
const storageKey = 'notes-' + this.props.route.params.user.username;
const value = await EncryptedStorage.getItem(storageKey);
```

and in the ```storeNotes(notes: INote[])``` function

```jsx
const storageKey = 'notes-' + this.props.route.params.user.username;

const jsonValue = JSON.stringify(notes);
await EncryptedStorage.setItem(storageKey, jsonValue);
```

###### 3.1.4 Security Improvement 
This is a security improvement because we are now leaving passwords out of persistent storage keys and storing notes using encrypted storage at rest, reducing the risk of sensitive data exposure if device storage is inspected.

**Reflection**  
These issues were somewhat hard to catch at first glance, I had to go over the files a bit more carefully, which made me realize how easily a vulnerability such as this one can go un-noticed during development and become a huge security concern.  
Through the fix, I could realize the importance of maintaining the use of sensitive data to a minimum, and I could also find great material such as the OWASP Mobile Top 10 [3] and the Android Developer security tips guidelines [2], which when implemented to your codebase, greatly reduces vulnerabilites.  
Lastly, I also realized the importance of using proper methods and storage types when dealing with sensitive data, for this issue simply removing the password for the key was enough, but for future interactions with sensitive data, it is crucial to use the adequate methods and proper encryption as well [3]. 

### 3.2. Improper Authentication
Author: Denver Timlick

###### 3.2.1 Vulnerability Description  
The original login flow handled authentication directly inside the `Login.tsx` screen and used hardcoded username and password pairs:

```tsx
const users: IUser[] = [
    { username: 'joe', password: 'secret' },
    { username: 'bob', password: 'password' },
];

if (username === user.username && password === user.password) {
    props.onLogin(foundUser);
}
```

This meant the app was trusting the client to decide whether a user was authenticated. It also exposed valid credentials in the mobile codebase, which can be inspected or reverse engineered. The same flow passed the full user object forward after login, including the password, even though protected screens only needed the username.
###### 3.2.2 Security Risk  
This is insecure because mobile application code can be reverse engineered, allowing attackers to recover hardcoded credentials or bypass client-side checks. In addition, the notes screen had no real session validation before loading protected content or adding notes, so access control depended entirely on the user reaching the screen through the expected path.
###### 3.2.3 Implemented Fix  
The authentication logic was moved out of the UI component and centralized in a dedicated `auth.ts` module. The login screen now submits credentials to that auth layer instead of validating them in the component itself. As part of this change, the hardcoded username and password list was removed from the client code entirely.

After a successful login, the app now creates an in-memory session object containing only:

```tsx
{
    username,
    sessionToken,
    expiresAt
}
```

The password is no longer kept in navigation state or reused after authentication. The `Notes` screen now checks whether the session is still valid when it loads and again before allowing protected actions such as adding a new note. If the session is invalid or expired, the user is logged out and must authenticate again.

Because this lab project does not include a backend service, the mobile client now performs only basic input validation locally and treats the authentication module as the boundary where a real server-side verification call would occur. This is safer than embedding credential pairs in the app because the client no longer exposes valid usernames or passwords in source code.

For the lab, the app also performs a local credential verification step without hardcoding plaintext credentials:
- On first login for a username, the app stores a salted PBKDF2 password verifier in encrypted storage (not plaintext).
- On later logins, the app derives the verifier again and compares it before creating a session.
###### 3.2.4 Security Improvement  
This improves security by removing hardcoded credentials from the client, reducing exposure of passwords, removing direct authentication decisions from the UI layer, and enforcing session checks before protected content can be accessed or modified. While this lab project still does not include a backend service, the new structure is closer to a secure design because it no longer relies on embedded credential pairs and can be replaced with a real server-side authentication API without changing the rest of the app.

**Reflection**
This issue showed how easy it is for authentication to look correct from a user-interface perspective while still being weak from a security perspective. Before making the fix, I mainly focused on whether login "worked," but the lab made it clear that where authentication happens is just as important as whether it succeeds. I also learned that protected screens should not simply assume the user is authorized forever after the first check. Even in a small app, adding session validation and avoiding unnecessary password handling makes the overall design much safer and easier to improve later.

### 3.3. Code Injection
Author: Naman Khanna

###### 3.3.1 Vulnerability Description  
Code injection was found in the note evaluation flow at `src/components/Note.tsx`, where user-controlled text (`props.text`) was passed directly to `eval()`:

```tsx
const result = eval(props.text);
```

This allowed the application to interpret input as JavaScript code instead of treating it as plain data.
###### 3.3.2 Security Risk  
Using `eval()` with user input is dangerous because an attacker can inject malicious JavaScript and execute arbitrary code in the app context. This can lead to unauthorized behavior, data exposure, app crashes, and bypass of expected logic.
###### 3.3.3 Implemented Fix  
The unsafe `eval()` call was removed and replaced with a secure `safeCalculate(expression)` function.  
The fix includes:

- Strict regex input validation that allows only `0-9`, `+`, `-`, `*`, `/`, `(`, `)` and whitespace.
- Sanitization by removing whitespace before parsing.
- Token validation to ensure only valid numbers/operators are processed.
- Safe arithmetic evaluation using operator and value stacks (no dynamic code execution).
- Rejection of invalid expressions and mismatched parentheses with controlled error handling.
###### 3.3.4 Security Improvement  
This is a security improvement because user input is no longer executed as code. The new logic treats input as data only, validates it against a strict allowlist, and calculates results safely. This prevents arbitrary code execution and significantly reduces the risk of code injection.

**Reflection**
This issue highlighted how a single convenience function such as `eval()` can introduce a critical vulnerability when connected to user input. Replacing it with explicit parsing and strict validation made the behavior predictable and secure while keeping the feature simple for a mobile lab project.

###### 3.3.5 Best Practices

- Never use `eval()` or `new Function()` on untrusted input.
- Use allowlist-based validation (regex) to restrict accepted characters and formats.
- Treat all user input as untrusted and process it as data, not executable code.
- Use explicit parsers/evaluators for expressions instead of runtime code execution.
- Fail safely: return controlled errors for invalid input instead of attempting to execute it.

### 3.4. Insufficient Input Validation
Author: Jasleen Kaur

###### 3.4.1 Vulnerability Description  
Insufficient input validation refers to accept user inputs without doing proper checks for length, content and formats on them. This creates the possibility of invalid or malicious inputs getting processed by the system. 

###### 3.4.2 Security Risk  
User inputs were not properly validated in the following files:

- src/Login.tsx (username and password fields)
- src/Notes.tsx (note title and math equation inputs)

Not validating the fields allows the users to enter invalid or unexpected data like special characters, empty values, or excessively long inputs. This could lead to application errors, unstable behavior, or potential security vulnerabilities. 

###### 3.4.3 Implemented Fix  
Input validation was added to all user input fields to ensure only valid data is accepted:

- In Login.tsx:
    - Username must be 3–20 characters long and contain only letters and numbers
    - Password must be at least 8 characters long
- In Notes.tsx:
    - Title must be at least 3 characters long
    - Title allows only letters, numbers, and spaces
    - Equation cannot be empty
    - Equation length is restricted to prevent excessive input

Additionally, validation checks were implemented using regular expressions and conditional statements, and clear security comments were added in the code.

###### 3.4.4 Security Improvement  
These improvements ensure the app only processes valid and properly formatted inputs. This prevents risk of app crashing, invalid data to be stored and strengthens overall security of the application by limiting user input handling. 

**Reflection**
Implementing proper user validation before processing them helped me understand significance of input sanitization. I learned that even simple inputs like usernames or text fields can become security risks if not properly controlled. I will always implement input validation checking for input formats, enforce length restrictions, and ensure that all user-provided data is treated as untrusted. 

### 3.5. Insecure Code Practices
Author: Sehajbir Kaur

###### 3.5.1 Vulnerability Description  
Insecure code practices include patterns that increase information leakage or make the app fragile under error conditions. The main issues identified were:

- Poor error handling (unhandled exceptions during storage access/parsing).
- Unsafe error exposure (showing raw errors or stack traces such as `alert(error.stack)`).
- Unsafe logging (logging passwords/tokens/user notes to the console during debugging).
- Weak randomness (`Math.random()`) for token-like values.
###### 3.5.2 Security Risk  
- Internal error details and stack traces help attackers learn app structure and failure modes.
- Logs can leak sensitive authentication data (passwords/session tokens) or private user notes.
- Predictable randomness can lead to guessable identifiers and weak session handling.
###### 3.5.3 Implemented Fix  
The following secure coding improvements were implemented:

- Centralized safe error logging in `src/security/reportError.ts`
  - Logs only a generic message (`console.error("Action failed")`) in dev
  - Avoids logging raw error objects, stacks, tokens, passwords, or note contents
- Generic user-facing error messages in catch blocks
  - Uses: `"Something went wrong. Please try again."`
  - Prevents information leakage to the user
- Hardened storage handling in `src/Notes.tsx`
  - Uses encrypted storage at rest (`react-native-encrypted-storage`)
  - Wraps storage access and JSON parsing in `try/catch` with safe handling
- Improved randomness and safe session creation in `src/auth.ts`
  - Uses secure randomness (`crypto.randomUUID` / `crypto.getRandomValues`)
  - No weak `Math.random()` fallback; fails closed if secure randomness is unavailable
###### 3.5.4 Security Improvement  
These changes improve security by preventing information leakage, reducing sensitive data exposure, and improving resilience:

- App errors fail safely without exposing stacks or internal implementation details.
- Logs contain only safe, generic messages and do not include secrets or user data.
- Notes are protected at rest using encrypted storage rather than plaintext persistence.
- Session tokens are generated using secure randomness to reduce predictability.

**Reflection**
This issue reinforced that security is not only about vulnerabilities like injection; it also depends on defensive patterns such as safe error handling and safe logging. Even small shortcuts in error handling or logging can leak information. By centralizing reporting and enforcing generic errors, the app becomes safer and easier to maintain.


## 4. References

[1] React Native. (2025, Sep. 10). AsyncStorage. Retrieved from https://reactnative.dev/docs/0.81/asyncstorage

[2] Android Developers. (2026, Mar. 06). Security tips. Retrieved from https://developer.android.com/privacy-and-security/security-tips

[3] OWASP Foundation. (2023). M9: Insecure Data Storage. OWASP Mobile Top 10. Retrieved from https://owasp.org/www-project-mobile-top-10/2023-risks/m9-insecure-data-storage.html

[4] emertechie. react-native-encrypted-storage. Retrieved from https://github.com/emeraldsanto/react-native-encrypted-storage

[5] OWASP Foundation. Password Storage Cheat Sheet (PBKDF2 guidance). Retrieved from https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
