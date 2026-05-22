# OD Club (formerly Elite Nexus)

OD Club is a comprehensive club management and access control system built for gym and game zone facilities. It features a modern, dark-themed "Rose Gold" UI, real-time access scanning with live camera capture, and a robust owner dashboard for monitoring and analytics.

## Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Styling**: TailwindCSS (via CDN)
- **Backend/Database**: Firebase (Authentication, Firestore, Storage)
- **Integrations**: 
  - `html5-qrcode` for scanning member digital IDs.
  - `Chart.js` for entry analytics.
  - `jsPDF` for exporting attendance reports.

---

## Project Structure

### HTML Files
- **`index.html`**: The main system portal that routes users to their respective modules (Gym Scanner, Game Zone Scanner, or Owner Panel).
- **`gym-scanner.html`**: Terminal for Gym access control. Allows admins to scan QR codes or manually enter member IDs, captures a live snapshot via webcam, checks for duplicate daily entries, and logs the check-in.
- **`gamezone-scanner.html`**: Terminal for Game Zone access control. Mirrors the gym scanner functionality but logs entries specifically for the Game Zone.
- **`clubowner.html`**: The comprehensive dashboard for club owners. Replaces the old Super Admin panel by centralizing all monitoring and management.

### JavaScript Files (`/js/`)
- **`firebase-config.js`**: Contains the initialization logic and API keys for connecting the application to Firebase.
- **`scanner-common.js`**: Shared utilities for both scanner modules. Includes authentication handlers (`loginOrSignup`), the `ScannerCamera` class for interacting with webcams and canvases, and UI alert helpers.
- **`clubowner.js`**: Drives the logic for the Club Owner panel. Handles:
  - Real-time Firestore subscriptions for live entry feeds.
  - Generating the 7-day Check-in Analytics Bar Chart.
  - Flagging suspicious activities (e.g., late-night entries between 12 AM and 4 AM).
  - Member CRUD operations (Registering new members with profile photos).
  - Filtering entries by date and exporting reports to PDF or CSV.

---

## Core Features

### 1. Unified Authentication
Each module requires login authentication via Firebase Auth. The system utilizes a smart login utility that automatically attempts to sign in the user, or creates the account if it doesn't exist yet, streamlining onboarding. Forms do not contain hardcoded credentials, allowing dynamic use in production.

### 2. Live Camera Capture & Security
When a member's ID is scanned at either the Gym or Game Zone:
- The system pulls their database profile photo.
- The administrator must click **"Capture Snapshot"** to grab a live frame from the scanner's webcam.
- The live snapshot is compared visually to the database photo and uploaded to Firebase Storage upon check-in confirmation to maintain a secure audit trail.

### 3. Suspicious Activity Detection
The system automatically monitors the timestamp of every entry. Check-ins occurring during unusual hours (12:00 AM to 4:00 AM) trigger a **Suspicious Alert**, which is immediately logged and highlighted on the Club Owner's dashboard.

### 4. Advanced Owner Analytics
The Club Owner Panel consolidates all facility data:
- **Quick Stats**: Real-time counters for Total Members, Gym Entries Today, Game Zone Entries Today, and Suspicious Alerts.
- **Interactive Chart**: A dynamic Chart.js bar graph displaying the check-in volume over the last 7 days.
- **Live Feed**: A running list of recent arrivals featuring their name, timestamp, entry type, profile picture, and the live snapshot taken at the door.
- **Report Exporting**: Owners can filter entries by custom date ranges and export the results to PDF or CSV.

---

## Setup & Deployment

1. **Local Development**:
   Run a local HTTP server in the root directory to avoid CORS/Webcam permission issues.
   ```bash
   npx http-server -p 8080
   ```
2. **Firebase Rules**:
   Ensure Firestore and Storage rules are configured to allow authenticated read/writes.
3. **Webcam Permissions**:
   The browser must grant camera permissions for the scanners to function. Localhost or HTTPS is required by modern browsers to use `navigator.mediaDevices.getUserMedia()`.
