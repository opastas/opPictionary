# opPictionary Game

A multiplayer pictionary game built with a pnpm monorepo containing web, mobile, and server components. Players can draw and guess words in real-time across web browsers and mobile devices.

## 🎮 Features

- **Real-time Multiplayer**: 2-player game with live drawing synchronization
- **Cross-Platform**: Web app (React + Vite) and mobile app (React Native + Expo)
- **Touch Drawing**: Mobile-optimized drawing with SVG
- **Live Chat**: Real-time messaging and guessing
- **Type Safety**: Shared TypeScript interfaces across all platforms
- **Modern Stack**: Node.js, Express, Socket.IO, React, React Native

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (>= 18.0.0) - [Download here](https://nodejs.org/)
- **pnpm** (>= 8.0.0) - Install with: `npm install -g pnpm`

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pictionary
```

Or if you're creating the project from scratch, ensure you have the complete project structure as shown in the [Project Structure](#-project-structure) section below.

### 2. Install Dependencies

Install all dependencies for the monorepo:

```bash
pnpm install
```

This will install dependencies for all workspaces (server, web app, mobile app, and shared types).

### 3. Create Environment Files

#### Server Environment
Create a `.env` file in the `server/` directory:

```bash
# server/.env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

#### Mobile App Environment
Create a `.env` file in the `apps/mobile/` directory:

```bash
# apps/mobile/.env
EXPO_PUBLIC_SERVER_URL=http://YOUR_LOCAL_IP:4000
```

### 4. Find Your Local IP Address

To connect mobile devices to the server, you need your computer's local IP address:

#### On macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
```

#### On Windows:
```bash
ipconfig | findstr "IPv4"
```

#### Alternative method:
1. Open your network settings
2. Look for your Wi-Fi connection details
3. Find the IP address (usually starts with 192.168.x.x or 10.x.x.x)

**Important**: Replace `YOUR_LOCAL_IP` in the mobile app's `.env` file with your actual local IP address.

### 5. Install Mobile Dependencies (Optional)

If you plan to run the mobile app, install additional web dependencies:

```bash
cd apps/mobile
npx expo install react-native-web @expo/metro-runtime
cd ../..
```

## 🏃‍♂️ Running the Application

### Quick Start (All Services)
```bash
./scripts/start-all.sh
```
This will start all services automatically and show you the correct URLs.

### Manual Start (Three Terminals)
You can also run three separate terminals to start all components:

### Terminal 1: Start the Server

```bash
pnpm --filter server dev
```

The server will start on `http://192.168.1.13:4000` and show:
```
🚀 Pictionary server running on port 4000
🎮 Game room: main-room
📝 Secret word: [word]
🌐 Server accessible at: http://192.168.1.13:4000
```

**Troubleshooting Server Issues:**
If you get "port already in use" errors, use the server manager script:
```bash
# Check server status
./scripts/server-manager.sh status

# Stop server if needed
./scripts/server-manager.sh stop

# Start server
./scripts/server-manager.sh start

# Restart server
./scripts/server-manager.sh restart
```

### Terminal 2: Start the Web App

```bash
pnpm --filter web dev
```

The web app will start on `http://localhost:5173` (or next available port like 5174, 5175) and automatically open in your browser.

### Terminal 3: Start the Mobile App

```bash
pnpm --filter mobile start
```

This will start the Expo development server. You can then:

- **On mobile device**: Scan the QR code with the Expo Go app
- **On iOS simulator**: Press `i` in the terminal
- **On Android emulator**: Press `a` in the terminal
- **On web browser**: Press `w` in the terminal

## 🎯 How to Play

### Cross-Platform Gameplay
Players can play together using **any combination** of:
- 🌐 **Web browsers** (Chrome, Firefox, Safari, Edge)
- 📱 **Mobile devices** (iOS/Android via Expo Go)
- 💻 **Desktop computers** (Windows, Mac, Linux)

### Game Flow
1. **Join the Game**: Enter your name in either the web or mobile app
2. **Role Assignment**: 
   - First player becomes the **drawer** (sees the secret word)
   - Second player becomes the **guesser** (tries to guess the word)
3. **Drawing Phase**: The drawer draws the secret word on the canvas
4. **Guessing Phase**: The guesser watches the drawing and submits guesses
5. **Scoring**: Correct guesses award 10 points and end the round

### Testing Cross-Platform Play
- **Web + Mobile**: One player on web, one on mobile
- **Web + Web**: Two players on different web browsers  
- **Mobile + Mobile**: Two players on different mobile devices
- **Mixed**: Any combination of the above

## 📁 Project Structure

```
pictionary/
├── pnpm-workspace.yaml          # pnpm workspace configuration
├── package.json                 # Root package.json with workspace scripts
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── server/                      # Node.js/Express server
│   ├── src/
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── apps/
│   ├── web/                    # Vite React + TypeScript app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── .env.local
│   └── mobile/                 # Expo React Native app
│       ├── components/
│       ├── hooks/
│       ├── App.tsx
│       ├── package.json
│       └── .env
└── packages/
    └── shared-types/           # Shared TypeScript interfaces
        ├── src/
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

## 🛠️ Available Scripts

### Root Level Commands

```bash
# Run all projects concurrently
pnpm dev

# Build all projects
pnpm build

# Type check all projects
pnpm type-check

# Clean all build outputs
pnpm clean

# Install dependencies for all workspaces
pnpm install:all
```

### Individual Project Commands

```bash
# Server only
pnpm server:dev

# Web app only
pnpm web:dev

# Mobile app only
pnpm mobile:dev
```

## 🔧 Development

### Adding New Dependencies

```bash
# Add to specific workspace
pnpm --filter server add express
pnpm --filter web add react-router-dom
pnpm --filter mobile add react-navigation

# Add to root (dev dependencies)
pnpm add -D typescript
```

### Building for Production

```bash
# Build all projects
pnpm build

# Build specific project
pnpm --filter server build
pnpm --filter web build
pnpm --filter mobile build
```

## 🌐 Network Configuration

### For Mobile Development

1. Ensure your computer and mobile device are on the same Wi-Fi network
2. Use your computer's local IP address in the mobile app's `.env` file
3. Make sure the server is accessible from your mobile device

### Troubleshooting Connection Issues

- **Mobile can't connect**: Check that the IP address in `.env` is correct
- **Server not starting**: Ensure port 4000 is not in use
- **Web app not loading**: Check that port 5173 is available (may use 5174, 5175, etc.)
- **Port conflicts**: Use `./scripts/start-all.sh` to automatically find available ports
- **Mobile app port issues**: May use 8081 or 8082 depending on availability
- **Game state issues**: Use `./scripts/reset-game.sh` to clear all players and reset the game
- **"Room full" errors**: Reset the game state to clear old connections

## 📱 Platform Support

- **Web**: Modern browsers with Canvas API support
- **iOS**: Native iOS app via Expo
- **Android**: Native Android app via Expo
- **Desktop**: Web version works on desktop browsers

## 🎨 Technologies Used

- **Backend**: Node.js, Express, Socket.IO, TypeScript
- **Web Frontend**: React, Vite, TypeScript, Socket.IO Client
- **Mobile Frontend**: React Native, Expo, TypeScript, Socket.IO Client
- **Drawing**: HTML5 Canvas (web), React Native SVG (mobile)
- **Monorepo**: pnpm workspaces
- **Type Safety**: Shared TypeScript interfaces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting-connection-issues) section
2. Ensure all prerequisites are installed
3. Verify environment variables are set correctly
4. Check that all services are running on the correct ports

For additional help, please open an issue in the repository.