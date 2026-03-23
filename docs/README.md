# Cross-Platform Security Lab

### Team Members:  

- Denver Timlick
- Jasleen Kaur
- Joao Santiago
- Naman Khanna
- Sehajbir Kaur

## 1. Introduction

## 2. Security Assessment
For this lab, we have performed a securiy assessment to try and find security vulnerabilities across the code, following on the following: 

- Insecure data storage
- Improper authentication
- Code injection
- Insufficient input validation
- Insecure coding practices

For each type, we analyzed the source code of the application and applied the appropriate mitigations

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
The fix implemented for  this issue was quite simple, for that we simply have removed the password as a component for key generation, now using only the non-sensitive username for it, this can be seen in the ```getStoredNotes()``` function 

```jsx
const storageKey = 'notes-' + this.props.route.params.user.username;
const value = await AsyncStorage.getItem(storageKey);
```

and in the ```storeNotes(notes: INote[])``` function

```jsx
const storageKey = 'notes-' + this.props.route.params.user.username;

const jsonValue = JSON.stringify(notes);
await AsyncStorage.setItem(storageKey, jsonValue);
```

###### 3.1.4 Security Improvement 
This is a security improvement because we are now leaving passwords out of operations that include persistent storage (saving information in the device)

**Reflection**  
These issues were somewhat hard to catch at first glance, I had to go over the files a bit more carefully, which made me realize how easily a vulnerability such as this one can go un-noticed during development and become a huge security concern.  
Through the fix, I could realize the importance of maintaining the use of sensitive data to a minimum, and I could also find great material such as the OWASP Mobile Top 10 [3] and the Android Developer security tips guidelines [2], which when implemented to your codebase, greatly reduces vulnerabilites.  
Lastly, I also realized the importance of using proper methods and storage types when dealing with sensitive data, for this issue simply removing the password for the key was enough, but for future interactions with sensitive data, it is crucial to use the adequate methods and proper encryption as well [3]. 

### 3.2. Improper Authentication
Author: Person 2

###### 3.2.1 Vulnerability Description  
Lorem Ipsum
###### 3.2.2 Security Risk  
Lorem Ipsum
###### 3.2.3 Implemented Fix  
Lorem Ipsum
###### 3.2.4 Security Improvement  
Lorem Ipsum

**Reflection**

### 3.3. Code Injection
Author: Person 3

###### 3.3.1 Vulnerability Description  
Lorem Ipsum
###### 3.3.2 Security Risk  
Lorem Ipsum
###### 3.3.3 Implemented Fix  
Lorem Ipsum
###### 3.3.4 Security Improvement  
Lorem Ipsum

**Reflection**

### 3.4. Insufficient Input Validation
Author: Person 4

###### 3.4.1 Vulnerability Description  
Lorem Ipsum
###### 3.4.2 Security Risk  
Lorem Ipsum
###### 3.4.3 Implemented Fix  
Lorem Ipsum
###### 3.4.4 Security Improvement  
Lorem Ipsum

**Reflection**

### 3.5. Insecure Code Practices
Author: Person 5

###### 3.5.1 Vulnerability Description  
Lorem Ipsum
###### 3.5.2 Security Risk  
Lorem Ipsum
###### 3.5.3 Implemented Fix  
Lorem Ipsum
###### 3.5.4 Security Improvement  
Lorem Ipsum

**Reflection**


## 4. References

[1] React Native. (2025, Sep. 10). AsyncStorage. Retrieved from https://reactnative.dev/docs/0.81/asyncstorage

[2] Android Developers. (2026, Mar. 06). Security tips. Retrieved from https://developer.android.com/privacy-and-security/security-tips

[3] OWASP Foundation. (2023). M9: Insecure Data Storage. OWASP Mobile Top 10. Retrieved from https://owasp.org/www-project-mobile-top-10/2023-risks/m9-insecure-data-storage.html
