# iOS App Store Guidelines Research: Third-Party API Keys

## Date: December 1, 2025

## Question
Can our iOS app allow users to provide their own RetroAchievements API key without violating App Store guidelines?

## Answer: YES - This is compliant with App Store guidelines

### Summary
Allowing users to provide their own API keys for third-party services (like RetroAchievements) is **acceptable** under iOS App Store guidelines. This approach is considered a user-provided credential for a third-party service and does not violate any specific guidelines.

## Key Findings

### 1. Third-Party Service Authentication (Compliant)
- Apps that require users to authenticate with **third-party services** are allowed
- Our use case: Users authenticate with their existing RetroAchievements account using their own API key
- **Guideline Exception**: We do NOT need to offer "Sign in with Apple" because our app is a client for a specific third-party service (RetroAchievements) where users access their existing account content

**Source**: [App Review Guidelines - Apple Developer](https://developer.apple.com/app-store/review/guidelines/)

### 2. Privacy and Data Disclosure Requirements
Our app must:
- ✅ Clearly disclose that RetroAchievements data will be accessed via the user-provided API key
- ✅ Explain what data is accessed (user profile, game list, achievement data)
- ✅ Obtain explicit permission before storing API keys
- ✅ Store API keys securely in iOS Keychain (using secure storage)
- ✅ Include privacy manifest detailing API usage

**Sources**:
- [Apple's New Privacy Requirements in the App Store](https://medium.com/@sachinsiwal/apples-new-privacy-requirements-in-the-app-store-92fb5b3e8a32)
- [Apple's new API declaration rules | Zudu](https://zudu.co.uk/blog/apples-new-api-declaration-rules/)

### 3. App Review Requirements
For App Store review, we must:
- ✅ Provide demo/test credentials (RA username + API key) for reviewers
- ✅ Document how users obtain their own API key from RetroAchievements
- ✅ Ensure the app functions without RA login (core guide reading features)

**Source**: [App Review Guidelines - Apple Developer](https://developer.apple.com/app-store/review/guidelines/)

### 4. RetroAchievements API Key Access
- Users obtain API keys from their RA control panel at retroachievements.org
- No login/OAuth flow exists - users manually retrieve their key
- API uses username + web API key (base64 encoded) for authentication
- This is a standard pattern for user-provided credentials

**Sources**:
- [Getting Started | RetroAchievements API](https://api-docs.retroachievements.org/getting-started.html)
- [Authentication through credentials · RetroAchievements](https://retroachievements.org/viewtopic.php?t=27642&c=234765)

## Recommendations for Implementation

### Required Implementation
1. **User Consent Flow** (Task 10.4)
   - Clear explanation: "This app uses your RetroAchievements API key to fetch your games and achievements"
   - Detail what data is accessed: game list, achievement progress, user profile
   - Explicit consent before storing API key

2. **Secure Storage** (Task 10.2, 10.5)
   - Store API keys in iOS Keychain via secure storage service
   - Never store in plain text or UserDefaults

3. **Privacy Policy** (Task 11.4)
   - Document RA API key usage
   - Explain data is fetched from RetroAchievements.org
   - Clarify we don't share RA data with third parties

4. **Settings UI** (Task 10.3)
   - Input fields for RA username and API key
   - Link to RA control panel for obtaining API key
   - "Test Connection" button to verify credentials
   - Clear logout/disconnect option

5. **Optional RA Integration** (Task 6.2)
   - App must work fully without RA login (core guide reading)
   - RA integration is enhancement-only (achievement tracking)

### For App Store Submission
1. Create test RA account and provide credentials to Apple reviewers
2. Document in App Review Notes how to obtain API key
3. Include privacy manifest detailing RA API usage
4. Ensure privacy policy is accessible in-app

## Conclusion
✅ **Our approach is compliant with iOS App Store guidelines**

Using user-provided API keys for RetroAchievements is acceptable because:
- It's authentication for a third-party service (exempt from Sign in with Apple requirement)
- Users are accessing their own existing RA account data
- We're not creating accounts or providing third-party login for our app's primary functionality
- The app's core features (guide reading) work without RA integration

**No architectural changes needed** - proceed with implementation as planned in the PRD.

---

## Sources
- [App Review Guidelines - Apple Developer](https://developer.apple.com/app-store/review/guidelines/)
- [Apple's New Privacy Requirements in the App Store](https://medium.com/@sachinsiwal/apples-new-privacy-requirements-in-the-app-store-92fb5b3e8a32)
- [Apple's new API declaration rules | Zudu](https://zudu.co.uk/blog/apples-new-api-declaration-rules/)
- [Getting Started | RetroAchievements API](https://api-docs.retroachievements.org/getting-started.html)
- [Authentication through credentials · RetroAchievements](https://retroachievements.org/viewtopic.php?t=27642&c=234765)
- [How to add auth to your Apple app in order to be listed in the Apple Store in 2025 — WorkOS](https://workos.com/blog/apple-app-store-authentication-sign-in-with-apple-2025)
