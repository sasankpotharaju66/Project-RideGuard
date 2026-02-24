import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import admin from 'firebase-admin';

// Initialize Firebase Admin (bypasses auth for local Firestore emulator)
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8082";
try {
  admin.initializeApp({ projectId: "rideguard-b23e5" });
} catch (e) {
  console.log("Firebase Admin already initialized");
}
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/** @type {Map<string, object>} */
const rides = new Map();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const toId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const toRad = (v) => (v * Math.PI) / 180;

/** Haversine distance in meters between two [lat,lon] pairs */
const haversineM = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
};

/** Distance in meters from point P to nearest segment in polyline */
const distToPolylineM = (point, polyline) => {
  if (!polyline || polyline.length === 0) return Infinity;
  let minDist = Infinity;
  for (const pt of polyline) {
    const d = haversineM(point, pt);
    if (d < minDist) minDist = d;
  }
  return minDist;
};

const interpolate = (from, to, steps = 60) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
  }
  return pts;
};

/** Broadcast a WS message to all connected clients */
const broadcast = (msg) => {
  const str = JSON.stringify(msg);
  wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(str); });
};

const broadcastRide = (rideId) => {
  const ride = rides.get(rideId);
  if (ride) broadcast({ type: 'ride:update', ride });
};

const broadcastEmergency = (rideId, emergency) => {
  broadcast({ type: 'emergency:alert', rideId, emergency });
};

// ─────────────────────────────────────────────
// Thresholds
// ─────────────────────────────────────────────
const DEVIATION_METERS = 300;   // distance threshold
const DEVIATION_SECS = 60;    // sustained deviation before alert
const NO_MOVEMENT_METERS = 20;    // movement below this is "stationary"
const NO_MOVEMENT_MS = 10 * 60 * 1000; // 10 minutes server backup threshold
const ALERT_THROTTLE_MS = 5 * 60 * 1000;  // 5 min between same-reason alerts

// ─────────────────────────────────────────────
// Emergency logger (shared by endpoints)
// ─────────────────────────────────────────────
const logEmergency = (rideId, reason, location, extras = {}) => {
  const ride = rides.get(rideId);
  if (!ride) return null;

  // Throttle duplicate same-reason alerts within 5 min
  const now = Date.now();
  const recent = ride.emergencies.find(
    (e) => e.reason === reason && now - e.timestamp < ALERT_THROTTLE_MS
  );
  if (recent) return null; // duplicate – skip

  const emergency = {
    id: toId(),
    rideId,
    reason, // ROUTE_DEVIATION | NO_MOVEMENT | MANUAL_ALERT
    location,
    userId: ride.userId,
    driverId: ride.driverId || 'driver-mock',
    timestamp: now,
    ...extras,
  };

  ride.emergencies.push(emergency);
  ride.rideStatus = 'EMERGENCY_TRIGGERED';
  rides.set(rideId, ride);

  // Broadcast to all WS clients (frontend safety overlay listens)
  broadcastEmergency(rideId, emergency);
  broadcastRide(rideId);

  console.log(`[EMERGENCY] rideId=${rideId} reason=${reason}`, location);
  return emergency;
};

// ─────────────────────────────────────────────
// Ride Endpoints (EXISTING — NOT MODIFIED)
// ─────────────────────────────────────────────

app.post('/api/rides', (req, res) => {
  const { pickupCoords, dropCoords, pickup, drop, userId, user } = req.body;
  if (!pickupCoords || !dropCoords)
    return res.status(400).json({ error: 'pickupCoords and dropCoords required' });

  const id = toId();
  const routePoints = interpolate(pickupCoords, dropCoords, 60);
  const ride = {
    id,
    userId: userId || 'anon',
    user: user || null,
    pickup: pickup || null,
    drop: drop || null,
    pickupCoords,
    dropCoords,
    // ── Safety fields ──────────────────────────
    rideStatus: 'STARTED',          // STARTED | IN_PROGRESS | COMPLETED | EMERGENCY_TRIGGERED
    originalRoute: [...routePoints], // immutable snapshot for deviation checking
    routeDeviationTriggered: false,
    deviationStartTimestamp: null,   // when driver first moved >300m off route
    lastMovementTimestamp: Date.now(),
    lastKnownPos: routePoints[0],
    emergencies: [],
    driverId: 'driver-' + toId(),
    // ── Simulation fields ──────────────────────
    routePoints,
    routeIndex: 0,
    captainPos: routePoints[0],
    createdAt: Date.now(),
  };

  rides.set(id, ride);

  // Simulate captain movement
  const iv = setInterval(() => {
    const r = rides.get(id);
    if (!r) return clearInterval(iv);
    r.routeIndex++;
    if (r.routeIndex >= r.routePoints.length) {
      r.rideStatus = 'COMPLETED';
      r.captainPos = r.routePoints[r.routePoints.length - 1];
      clearInterval(iv);
    } else {
      r.captainPos = r.routePoints[r.routeIndex];
      r.lastKnownPos = r.captainPos;
      r.lastMovementTimestamp = Date.now();
      if (r.routeIndex > 3) r.rideStatus = 'IN_PROGRESS';
    }
    // Backward compat field
    r.status = r.rideStatus === 'COMPLETED' ? 'completed'
      : r.rideStatus === 'IN_PROGRESS' ? 'riding' : 'assigned';
    rides.set(id, r);
    broadcastRide(id);
  }, 1500);

  res.json({ ride });
  broadcastRide(id);
});

app.get('/api/rides/:id', (req, res) => {
  const r = rides.get(req.params.id);
  if (!r) return res.status(404).json({ error: 'not found' });
  res.json({ ride: r });
});

// ─────────────────────────────────────────────
// SAFETY — GPS Update Endpoint
// ─────────────────────────────────────────────
/**
 * POST /api/gps-update
 * Body: { rideId, lat, lon, userId }
 * Runs deviation detection + no-movement backup check.
 */
app.post('/api/gps-update', (req, res) => {
  const { rideId, lat, lon } = req.body;
  if (!rideId || lat == null || lon == null)
    return res.status(400).json({ error: 'rideId, lat, lon required' });

  const ride = rides.get(rideId);
  if (!ride) return res.status(404).json({ error: 'ride not found' });

  const now = Date.now();
  const currentPos = [lat, lon];
  const prevPos = ride.lastKnownPos;

  // ── Movement check ──────────────────────────
  const movedM = haversineM(prevPos, currentPos);
  if (movedM > NO_MOVEMENT_METERS) {
    ride.lastMovementTimestamp = now;
    ride.lastKnownPos = currentPos;
  }

  // ── Server-side no-movement backup ──────────
  const noMovementMs = now - ride.lastMovementTimestamp;
  if (noMovementMs > NO_MOVEMENT_MS && ride.rideStatus === 'IN_PROGRESS') {
    logEmergency(rideId, 'NO_MOVEMENT', currentPos, { noMovementMs });
  }

  // ── Deviation check ──────────────────────────
  const deviationM = distToPolylineM(currentPos, ride.originalRoute);
  if (deviationM > DEVIATION_METERS) {
    if (!ride.deviationStartTimestamp) {
      ride.deviationStartTimestamp = now;
    } else {
      const deviatedSecs = (now - ride.deviationStartTimestamp) / 1000;
      if (deviatedSecs > DEVIATION_SECS && !ride.routeDeviationTriggered) {
        ride.routeDeviationTriggered = true;
        logEmergency(rideId, 'ROUTE_DEVIATION', currentPos, {
          deviationMeters: Math.round(deviationM),
          deviatedSeconds: Math.round(deviatedSecs),
        });
      }
    }
  } else {
    // Back on route — reset deviation timer
    ride.deviationStartTimestamp = null;
  }

  rides.set(rideId, ride);
  res.json({
    ok: true,
    deviationMeters: Math.round(distToPolylineM(currentPos, ride.originalRoute)),
    noMovementMs,
    emergencyTriggered: ride.routeDeviationTriggered,
  });
});

// ─────────────────────────────────────────────
// SAFETY — Emergency Trigger Endpoint
// ─────────────────────────────────────────────
/**
 * POST /api/emergency/trigger
 * Body: { rideId, userId, location: [lat,lon], reason, gender?, emergencyContacts? }
 */
app.post('/api/emergency/trigger', async (req, res) => {
  const { rideId, userId, location, reason, gender, emergencyContacts } = req.body;
  if (!rideId || !location || !reason)
    return res.status(400).json({ error: 'rideId, location, reason required' });

  const ride = rides.get(rideId);
  if (!ride) return res.status(404).json({ error: 'ride not found' });

  // Validate ride ownership
  if (ride.userId !== (userId || ride.userId))
    return res.status(403).json({ error: 'not authorized' });

  const emergency = logEmergency(rideId, reason, location, { gender, manualTrigger: true });
  if (!emergency) {
    return res.json({ ok: true, throttled: true, message: 'Alert already sent recently' });
  }

  // Simulate contacting emergency services (log only — no real API)
  const targets = [];

  if (emergencyContacts && emergencyContacts.length > 0) {
    for (const contact of emergencyContacts) { // Changed to for...of for async/await
      targets.push(`Push Notification: ${contact.phone}`);
      console.log(`\n======================================================`);
      console.log(`📱 [ALERT INITIATED] To: ${contact.name} (${contact.phone})`);
      console.log(`   "URGENT: ${ride.user?.name || 'Your contact'} has triggered an SOS alert! Live Location: https://maps.google.com/?q=${location[0]},${location[1]}"`);

      try {
        // TELEGRAM INTEGRATION
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8757776907:AAFztxcZXNxfM8c8LdpfdHJ4wbxT2njTSb0';
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6135217618';

        if (TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' && TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
          const message = `🚨 *EMERGENCY ALERT!* 🚨\n\n*${ride.user?.name || 'Your contact'}* has triggered an SOS alert during their ride!\n\nLive GPS Location: https://maps.google.com/?q=${location[0]},${location[1]}\nContact: ${contact.name} (${contact.phone})`;

          const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'Markdown'
            })
          });

          if (tgResponse.ok) {
            console.log(`✅ Telegram Notification sent successfully to Chat ID: ${TELEGRAM_CHAT_ID}!`);
          } else {
            const errBody = await tgResponse.text();
            console.log(`❌ Telegram Delivery Error:`, errBody);
          }
        } else {
          console.log(`⚠️ Telegram notifications skipped. Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.`);
        }
        // Query Firestore for contact's device token
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('phone', '==', contact.phone).get();
        if (!snapshot.empty) {
          const contactUser = snapshot.docs[0].data();
          if (contactUser.fcmToken) {
            const payload = {
              token: contactUser.fcmToken,
              notification: {
                title: `🚨 Emergency Alert: ${ride.user?.name || 'Someone'} needs help!`,
                body: `An SOS was triggered during a ride. Tap to view their live GPS.`
              },
              data: {
                url: `https://maps.google.com/?q=${location[0]},${location[1]}`
              }
            };
            // This will attempt to send real FCM push. (Requires keys in prod)
            await admin.messaging().send(payload);
            console.log(`✅ Push Notification sent successfully to ${contact.name}'s device!`);
          } else {
            console.log(`⚠️ User ${contact.name} has no FCM device token stored. Push skipped.`);
          }
        } else {
          console.log(`⚠️ Contact ${contact.name} (${contact.phone}) not found in app database.`);
        }
      } catch (err) {
        console.log(`❌ Notification Delivery Error: ${err.message}`);
      }
      console.log(`======================================================\n`);
    }
  } else {
    targets.push('emergency_contacts');
  }

  if (gender === 'female') {
    targets.push('she_team_api', 'nearest_police_station');
  } else {
    targets.push('nearest_police_station');
  }
  console.log(`[EMERGENCY ROUTING] Notified: ${targets.join(', ')}`);

  res.json({ ok: true, emergency, notifiedTargets: targets });
});

// ─────────────────────────────────────────────
// SAFETY — Emergency Log Fetch
// ─────────────────────────────────────────────
app.get('/api/emergency/:rideId', (req, res) => {
  const ride = rides.get(req.params.rideId);
  if (!ride) return res.status(404).json({ error: 'not found' });
  res.json({ emergencies: ride.emergencies, rideStatus: ride.rideStatus });
});

// ─────────────────────────────────────────────
// SAFETY — Batch Offline Location Upload
// ─────────────────────────────────────────────
/**
 * POST /api/locations/batch
 * Body: { rideId, updates: [{ lat, lon, timestamp }] }
 * Replays GPS updates in order — ensures no data loss when device reconnects.
 */
app.post('/api/locations/batch', (req, res) => {
  const { rideId, updates } = req.body;
  if (!rideId || !Array.isArray(updates))
    return res.status(400).json({ error: 'rideId and updates[] required' });

  const ride = rides.get(rideId);
  if (!ride) return res.status(404).json({ error: 'ride not found' });

  // Sort by timestamp and replay each update
  const sorted = [...updates].sort((a, b) => a.timestamp - b.timestamp);
  let processed = 0;
  for (const upd of sorted) {
    if (upd.lat != null && upd.lon != null) {
      const currentPos = [upd.lat, upd.lon];
      const movedM = haversineM(ride.lastKnownPos, currentPos);
      if (movedM > NO_MOVEMENT_METERS) {
        ride.lastMovementTimestamp = upd.timestamp || Date.now();
        ride.lastKnownPos = currentPos;
      }
      processed++;
    }
  }
  rides.set(rideId, ride);
  console.log(`[BATCH] rideId=${rideId} replayed ${processed} GPS updates`);
  res.json({ ok: true, processed });
});

// ─────────────────────────────────────────────
// WebSocket
// ─────────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.on('message', (m) => {
    try {
      const msg = JSON.parse(m.toString());
      if (msg.type === 'subscribe' && msg.rideId) {
        const r = rides.get(msg.rideId);
        if (r) ws.send(JSON.stringify({ type: 'ride:update', ride: r }));
      }
    } catch (e) { }
  });
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
const PORT = process.env.MOCK_PORT || 4001;
server.listen(PORT, () => {
  console.log(`Mock server with safety APIs listening on http://localhost:${PORT}`);
  console.log('Endpoints: POST /api/rides, GET /api/rides/:id');
  console.log('Safety:    POST /api/gps-update, POST /api/emergency/trigger');
  console.log('           GET  /api/emergency/:rideId, POST /api/locations/batch');
});
