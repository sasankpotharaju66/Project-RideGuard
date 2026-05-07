# 🛡️ RideGuard - Smart Safety & Secure Journey

RideGuard is a premium ride-sharing application focused on passenger and captain safety. It features a real-time safety monitor that detects route deviations, inactivity, and allows for manual SOS triggers.

## 🚀 Key Safety Features

- **🚨 Premium SOS Telegram Alerts**: Instant high-priority notifications sent to multiple emergency recipients simultaneously.
- **📱 Multi-Channel Notifications**: Integrated Telegram and Firebase Cloud Messaging (FCM) for reliable alert delivery.
- **🛰️ Intelligent Monitoring**:
  - **Route Deviation**: Detects when a driver moves significantly off the assigned path.
  - **Inactivity Protection**: Alerts if the vehicle stops moving for an unusual duration.
  - **Manual SOS**: One-tap emergency broadcast for immediate distress signal.
- **🗺️ Live GPS Tracking**: Real-time location sharing with emergency contacts via Google Maps.

## 🛠️ Getting Started

To run RideGuard locally, you need to start three core components:

### 1. Frontend Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) to view the app.

### 2. Safety Mock Server (Backend)
The backend handles emergency triggers, Telegram routing, and GPS simulation.
```bash
npm run mock
```
Default port: `4001`

### 3. Firebase Emulators
For local database and authentication support.
```bash
firebase emulators:start
```

## 📡 Telegram Configuration

To receive emergency alerts on your phone:
1. Create a bot using [BotFather](https://t.me/botfather) and get your **Bot Token**.
2. Get your **Chat ID** using [IDBot](https://t.me/myidbot).
3. Update `server/mock-server.js`:
   - Set `TELEGRAM_BOT_TOKEN`.
   - Add your IDs to the `hardcodedIds` array or use the `TELEGRAM_CHAT_IDS` environment variable.

## 🏗️ Technology Stack

- **Frontend**: React, Vite, TypeScript, shadcn/ui, Tailwind CSS.
- **Backend**: Node.js, Express (Mock Server), WebSocket.
- **Database/Auth**: Firebase Firestore & Auth.
- **Maps**: Google Maps Platform.

---
*Built with safety as the #1 priority.*
