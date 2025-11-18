# GameRank - Video Game Ranking App

A mobile app where you can rank video games you've played, compare them against other games, and share your ranking lists with others.

## Features

- 🎮 **Rank Games**: Add games to your personal ranking list
- 📊 **Compare Games**: Compare new games against ones you've already ranked
- 📱 **Share Rankings**: Share your top game lists with friends
- 🔍 **Discover Games**: Browse popular games and add them to your rankings
- 👤 **User Profiles**: Track your stats and view your top games

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (iOS or Android)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Running on Different Platforms

- **iOS Simulator**: `npm run ios`
- **Android Emulator**: `npm run android`
- **Web**: `npm run web`

## Previewing the App on iPhone

There are several ways to preview your app on an iPhone:

### Option 1: Expo Go (Easiest - No Build Required) ⚡

This is the fastest way to preview your app during development:

1. **Install Expo Go** on your iPhone from the App Store (free)

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Connect your iPhone**:
   - Make sure your iPhone and computer are on the **same Wi-Fi network**
   - Scan the QR code that appears in the terminal with:
     - **iPhone Camera app** (iOS 11+) - just point and tap the notification
     - Or use the **Expo Go app** to scan the QR code

4. The app will load on your iPhone instantly!

**Note**: Some native features may be limited in Expo Go. For full functionality, use Option 2 or 3.

### Option 2: iOS Simulator (Mac Only) 💻

If you have a Mac with Xcode installed:

1. **Start the iOS Simulator**:
   ```bash
   npm run ios
   ```

2. This will:
   - Open the iOS Simulator automatically
   - Install and launch your app
   - Hot reload on code changes

**Requirements**: 
- macOS
- Xcode (free from Mac App Store)
- iOS Simulator (comes with Xcode)

### Option 3: Development Build (Full Native Features) 📱

For testing with all native features enabled:

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Build a development version**:
   ```bash
   eas build --platform ios --profile development
   ```

4. **Install on your iPhone**:
   - Download the build from the provided link
   - Install via TestFlight or direct installation
   - This gives you a standalone app with full native capabilities

### Option 4: Preview Build (For Testing Before Release) 🚀

Create a preview build that can be shared with testers:

1. **Build preview version**:
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Share with testers**:
   - Get a download link from EAS
   - Install directly on iPhone (no App Store needed)
   - Perfect for beta testing

### Quick Comparison

| Method | Speed | Native Features | Requirements |
|--------|-------|----------------|--------------|
| **Expo Go** | ⚡ Instant | Limited | iPhone + Wi-Fi |
| **iOS Simulator** | ⚡ Fast | Full | Mac + Xcode |
| **Dev Build** | 🐢 15-20 min | Full | EAS account |
| **Preview Build** | 🐢 15-20 min | Full | EAS account |

### Troubleshooting Preview Issues

**Can't connect with Expo Go?**
- Ensure iPhone and computer are on the same Wi-Fi
- Try using `npm start -- --tunnel` for tunnel mode
- Check firewall settings

**Simulator not opening?**
- Make sure Xcode is installed: `xcode-select --install`
- Open Xcode once to accept license agreements

## Building for iPhone (iOS)

To create a standalone iPhone app that can be installed on devices or submitted to the App Store, you'll use **Expo Application Services (EAS Build)**.

### Prerequisites for iOS Build

1. **Apple Developer Account** (required for App Store submission or TestFlight)
   - Free account works for development builds
   - Paid account ($99/year) required for App Store distribution

2. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**:
   ```bash
   eas login
   ```

### Building for iOS

1. **Configure your project** (already done - `eas.json` is set up):
   - The `eas.json` file has been created with iOS build configurations

2. **Build for iOS Simulator** (for testing):
   ```bash
   eas build --platform ios --profile development
   ```

3. **Build for Physical Device** (internal testing):
   ```bash
   eas build --platform ios --profile preview
   ```

4. **Build for App Store** (production):
   ```bash
   eas build --platform ios --profile production
   ```

### First-Time iOS Build Setup

On your first build, EAS will guide you through:
- Creating an Expo account (if you don't have one)
- Setting up your Apple Developer credentials
- Configuring certificates and provisioning profiles

**For App Store builds**, you'll need:
- Apple Developer Program membership
- App Store Connect access
- Certificates and provisioning profiles (EAS can generate these automatically)

### Installing the Built App

After the build completes:
- **Simulator builds**: Download and drag into iOS Simulator
- **Device builds**: Install via TestFlight or direct download link
- **App Store**: Submit via `eas submit` or manually through App Store Connect

### Quick Start Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS device (preview)
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store (after production build)
eas submit --platform ios
```

### Notes

- **Free tier**: EAS Build offers free builds for development and preview
- **Production builds**: May require EAS Build credits (free tier includes some)
- **Build time**: First build takes ~15-20 minutes, subsequent builds are faster
- **Bundle ID**: Currently set to `com.gamerank.app` (change in `app.json` if needed)

## Project Structure

```
gamerank/
├── App.js                 # Main app component with navigation
├── src/
│   └── screens/
│       ├── AuthScreen.js      # Login/Signup
│       ├── HomeScreen.js       # Main rankings list
│       ├── RankScreen.js       # Add/rank new games
│       ├── DiscoverScreen.js   # Browse popular games
│       ├── ProfileScreen.js    # User profile and stats
│       └── GameDetailScreen.js # Game details view
├── package.json
└── README.md
```

## Features in Detail

### Ranking System
- Add games with name, genre, and rating
- Compare new games against existing rankings
- Automatic sorting by rating
- Visual ranking list with position numbers

### Social Features
- Share your complete ranking list
- View other users' rankings (coming soon)
- Export rankings as text

### User Experience
- Beautiful dark theme UI
- Smooth navigation
- Offline-first with local storage
- Intuitive game comparison interface

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Supabase** - Backend (PostgreSQL database, authentication, real-time)
- **Expo Sharing** - Share functionality

## Future Enhancements

- [x] Backend API integration (Supabase)
- [x] User authentication with real backend
- [ ] Social features (follow users, like rankings)
- [ ] Game database integration (IGDB API)
- [ ] Game images and covers
- [ ] Advanced filtering and sorting
- [ ] Export rankings as images
- [ ] Push notifications

## Backend Setup

This app uses **Supabase** as the backend for authentication and data storage.

### Quick Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your API keys** from Settings → API
3. **Configure the app**: Update `src/config/supabase.js` with your URL and anon key
4. **Set up the database**: Run the SQL from `database/schema.sql` in Supabase SQL Editor

See **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for detailed setup instructions.

### Features

- ✅ User authentication (email/password)
- ✅ Cloud database (PostgreSQL)
- ✅ Real-time updates
- ✅ Row Level Security (RLS)
- ✅ Automatic profile creation
- ✅ Secure API access

## License

MIT

