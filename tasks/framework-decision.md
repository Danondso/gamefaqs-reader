# React Native Framework Decision: Expo vs React Native CLI

## Decision: **Use Expo**

## Rationale

### Requirements Analysis
Based on our PRD, the app needs:
1. ✅ iOS development with future Android compatibility
2. ✅ File system access (for guide import)
3. ✅ SQLite database
4. ✅ Secure storage (iOS Keychain)
5. ✅ Paid app distribution ($2 on App Store)
6. ✅ Native iOS features (Dynamic Type, VoiceOver)

### Expo Advantages

#### 1. **Cross-Platform Foundation** ✅
- Built-in support for iOS and Android
- Single codebase for future Android release
- Aligns with PRD goal: "Build foundation for future Android release"

#### 2. **Required Features Supported** ✅
All our critical features are available in Expo:
- **File System**: `expo-file-system` and `expo-document-picker` for guide import
- **SQLite**: `expo-sqlite` (official, well-maintained)
- **Secure Storage**: `expo-secure-store` (iOS Keychain wrapper)
- **App Store Distribution**: Full support for paid apps

#### 3. **Development Velocity** 🚀
- Faster development cycle (hot reload, instant updates)
- Built-in development tools and debugging
- Easier testing on physical devices
- OTA updates for post-launch bug fixes (without App Store review)

#### 4. **iOS-Specific Features** ✅
- Full access to iOS APIs we need:
  - Dynamic Type via React Native's built-in support
  - VoiceOver via `accessible` props
  - High contrast mode detection
- Can use Config Plugins for any native iOS code if needed

#### 5. **Future-Proofing** ✅
- Easy migration path if we need to eject later
- Active development and community support
- Regular updates aligned with new iOS/Android releases

### Expo Limitations (Addressed)

#### Concern: "Does Expo support paid apps?"
**Yes** - Expo fully supports paid app distribution on both App Stores. You configure pricing in App Store Connect, not in the framework.

#### Concern: "Can we access iOS Keychain?"
**Yes** - `expo-secure-store` provides direct access to iOS Keychain for secure API key storage.

#### Concern: "Can we import files from device storage?"
**Yes** - `expo-document-picker` and `expo-file-system` provide file system access for guide import.

#### Concern: "Do we need native modules?"
**Not for MVP** - All our requirements are covered by Expo SDK. If we need custom native code later, we can use Config Plugins or prebuild.

### React Native CLI (Rejected)

#### Why Not CLI?
- ❌ More complex setup (Xcode configuration, CocoaPods, etc.)
- ❌ Slower development cycle
- ❌ Harder to maintain cross-platform parity
- ❌ More manual configuration for iOS features
- ❌ No benefit for our use case - all features available in Expo

#### When to Use CLI Instead
- Heavy native module requirements
- Existing native codebase to integrate
- Specific native functionality not in Expo SDK
- **None of these apply to our app**

### Comparison Matrix

| Feature | Expo | React Native CLI | Our Need |
|---------|------|------------------|----------|
| iOS Development | ✅ Excellent | ✅ Excellent | Required |
| Android Future Support | ✅ Built-in | ✅ Manual Setup | Required |
| File System Access | ✅ expo-file-system | ✅ react-native-fs | Required |
| SQLite | ✅ expo-sqlite | ✅ react-native-sqlite-storage | Required |
| Secure Storage | ✅ expo-secure-store | ✅ react-native-keychain | Required |
| App Store Paid Apps | ✅ Supported | ✅ Supported | Required |
| Development Speed | ✅ Fast | ⚠️ Slower | Important |
| Setup Complexity | ✅ Simple | ❌ Complex | Important |
| OTA Updates | ✅ Built-in | ❌ Manual | Nice-to-have |
| Bundle Size | ⚠️ Slightly Larger | ✅ Optimized | Low Priority |

## Implementation Plan

### 1. Use Expo SDK 52 (Latest Stable)
```bash
npx create-expo-app@latest gamefaqs-reader --template expo-template-blank-typescript
```

### 2. Key Dependencies to Install
- `expo-sqlite` - Database
- `expo-secure-store` - iOS Keychain
- `expo-file-system` - File operations
- `expo-document-picker` - Guide import
- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab bar

### 3. iOS-Specific Configuration
- Configure `app.json` for iOS bundle ID, version, icons
- Set up iOS build configuration
- Configure capabilities (if needed for file access)

### 4. Future Android Support
When ready for Android:
- Add Android-specific configuration to `app.json`
- Test on Android devices
- Submit to Google Play Store
- **No code changes needed** - same codebase works

## Conclusion

**Expo is the right choice** for this project because:
1. ✅ Meets all technical requirements
2. ✅ Faster development for solo developer / small team
3. ✅ Built-in Android support for future expansion
4. ✅ Lower maintenance burden
5. ✅ No downsides for our specific use case

This decision aligns with the PRD's goal to "build a clean codebase that can expand to Android in the future" while delivering the iOS MVP quickly.

---

## References
- [Expo Documentation](https://docs.expo.dev/)
- [Expo SDK API Reference](https://docs.expo.dev/versions/latest/)
- [React Native vs Expo](https://docs.expo.dev/faq/)
