# RideGuard - Setup Instructions

Since this is for your friend, I've made it "Plug and Play." All your current keys (Google Maps & Telegram) are already included.

## 1. Quick Setup
Open your terminal in the project folder and run:
```bash
npm install
```

## 2. Running the Project
You need to open **3 Terminals** and run one command in each:

### Terminal 1: Database
```bash
firebase emulators:start
```

### Terminal 2: Backend (Alerts & Simulations)
```bash
npm run dev:backend
```

### Terminal 3: Frontend (Website)
```bash
npm run dev
```

The app will open at `http://localhost:8080/`.

---

## � Note for you (Before Zipping)
When you zip the folder to send to your friend, make sure you **include the `.env` file**. That file contains the Google Maps key so they don't have to create it themselves!
