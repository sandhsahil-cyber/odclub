# OD Club - Full Source Code

This file contains the complete source code and project details for OD Club.

## README.md

`$lang
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

``n
## index.html

`$lang
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>OD Club Portal</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary-fixed-variant": "#474646", "tertiary-container": "#649d75", "on-error-container": "#ffdad6",
                        "surface-container": "#1f1f1f", "on-primary": "#551e29", "surface-bright": "#393939",
                        "on-error": "#690005", "surface-container-low": "#1b1b1b", "inverse-on-surface": "#303030",
                        "on-surface": "#e2e2e2", "inverse-surface": "#e2e2e2", "surface-dim": "#131313",
                        "outline-variant": "#524345", "surface-tint": "#ffb2bc", "surface-container-highest": "#353535",
                        "on-surface-variant": "#d7c1c3", "tertiary": "#98d4a8", "on-background": "#e2e2e2",
                        "outline": "#9f8c8e", "surface-variant": "#353535", "error": "#ffb4ab",
                        "surface": "#131313", "primary": "#ffb2bc", "surface-container-high": "#2a2a2a",
                        "background": "#131313", "error-container": "#93000a", "surface-container-lowest": "#0e0e0e"
                    },
                    "fontFamily": {
                        "label-md": ["Inter"], "headline-lg-mobile": ["Oswald"], "headline-md": ["Oswald"],
                        "display-lg": ["Oswald"], "body-lg": ["Inter"], "body-md": ["Inter"], "headline-lg": ["Oswald"]
                    }
                }
            }
        }
    </script>
    <style>
        body { background-color: #131313; color: #e2e2e2; min-height: max(884px, 100dvh); }
        .glow-primary { box-shadow: 0 0 15px rgba(255, 178, 188, 0.3); }
        .bento-card {
            background-color: #0A0A0A; border-top: 2px solid rgba(183, 110, 121, 0.4);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .bento-card:hover { border-top-color: #ffb2bc; box-shadow: 0 0 20px rgba(183, 110, 121, 0.1); transform: translateY(-4px); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
    </style>
</head>
<body class="flex flex-col min-h-screen relative overflow-hidden">
    <!-- Background overlay from designs -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDglD7Dwdr6hs-yJ71lAUb1O4ISzuBnJzO722WaUUJQHc9OwpX3Voh915eplCa1rZcFQMUKfI9_ebonizdYTO19wM9JPrKdQHqSgRhU36EaXitjEwXH5quZ9-HqWE4_KfPficVZXJxn3ZbPGytvio0qCGEUg861gDBJe1eX6FXiBtwk9zXMBJ6qXYJDrsOABBg-oSzXijAmfGfcUnU87x3kntcTmjc3OQJKKbk_-q9ucNzuV2vd0QpM95qV9vkLw94bThCdnPSgKP0')] bg-cover mix-blend-overlay z-0"></div>

    <header class="bg-background/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-50">
        <div class="flex justify-center md:justify-start items-center px-8 py-4 w-full max-w-7xl mx-auto h-20">
            <h1 class="font-headline-lg text-primary uppercase tracking-widest text-2xl flex items-center gap-2">
                <span class="material-symbols-outlined">workspace_premium</span>
                OD Club
            </h1>
        </div>
    </header>

    <main class="flex-grow w-full max-w-7xl mx-auto px-8 py-12 z-10 relative">
        <div class="mb-12 text-center md:text-left">
            <h2 class="font-headline-lg text-on-surface uppercase mb-2 text-4xl">System Portal</h2>
            <p class="font-body-md text-on-surface-variant tracking-wide">Select your destination module to authenticate and proceed.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Gym Scanner -->
            <a href="/gym-scanner.html" class="bento-card p-8 rounded-xl h-64 group cursor-pointer">
                <div>
                    <span class="material-symbols-outlined text-primary text-4xl mb-4 group-hover:scale-110 transition-transform">fitness_center</span>
                    <h3 class="font-headline-md text-on-surface uppercase mb-2">Gym Scanner</h3>
                    <p class="font-label-md text-on-surface-variant text-sm">Verify member credentials and log daily attendance. Camera access required.</p>
                </div>
                <div class="flex items-center gap-2 text-primary mt-4 font-label-md uppercase tracking-wider text-xs">
                    Access Module <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </a>

            <!-- Game Zone Scanner -->
            <a href="/gamezone-scanner.html" class="bento-card p-8 rounded-xl h-64 group cursor-pointer">
                <div>
                    <span class="material-symbols-outlined text-primary text-4xl mb-4 group-hover:scale-110 transition-transform">sports_esports</span>
                    <h3 class="font-headline-md text-on-surface uppercase mb-2">Game Zone</h3>
                    <p class="font-label-md text-on-surface-variant text-sm">Verify digital IDs for Nexus Game Zone entry authorizations.</p>
                </div>
                <div class="flex items-center gap-2 text-primary mt-4 font-label-md uppercase tracking-wider text-xs">
                    Access Module <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </a>

            <!-- Club Owner Panel -->
            <a href="/clubowner.html" class="bento-card p-8 rounded-xl h-64 group cursor-pointer border-l-4 border-l-primary">
                <div>
                    <span class="material-symbols-outlined text-primary text-4xl mb-4 group-hover:scale-110 transition-transform">admin_panel_settings</span>
                    <h3 class="font-headline-md text-on-surface uppercase mb-2">Owner Panel</h3>
                    <p class="font-label-md text-on-surface-variant text-sm">Real-time check-in monitoring, capacity metrics, and member management.</p>
                </div>
                <div class="flex items-center gap-2 text-primary mt-4 font-label-md uppercase tracking-wider text-xs">
                    Access Module <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </a>

            
        </div>
    </main>

    <footer class="mt-auto py-8 border-t border-outline-variant/10 z-10 relative">
        <div class="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="font-label-md text-on-surface-variant uppercase tracking-widest text-xs">Â© 2024 OD Club CORP. ALL RIGHTS RESERVED.</p>
        </div>
    </footer>

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js');
            });
        }
    </script>
</body>
</html>

``n
## gym-scanner.html

`$lang
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Gym Scanner | OD Club</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    
    <!-- Firebase CDN -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
    <script src="/js/firebase-config.js"></script>
    <script src="/js/scanner-common.js"></script>
    <!-- html5-qrcode for scanning -->
    <script src="https://unpkg.com/html5-qrcode"></script>

    <script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary-fixed-variant": "#474646",
                      "tertiary-container": "#649d75",
                      "on-error-container": "#ffdad6",
                      "secondary-fixed": "#e5e2e1",
                      "tertiary-fixed-dim": "#98d4a8",
                      "surface-container": "#1f1f1f",
                      "primary-fixed": "#ffd9dd",
                      "on-primary": "#551e29",
                      "surface-bright": "#393939",
                      "on-error": "#690005",
                      "surface-container-low": "#1b1b1b",
                      "inverse-on-surface": "#303030",
                      "secondary": "#c9c6c5",
                      "on-tertiary-fixed-variant": "#16512f",
                      "secondary-fixed-dim": "#c9c6c5",
                      "on-surface": "#e2e2e2",
                      "inverse-surface": "#e2e2e2",
                      "on-secondary": "#313030",
                      "on-tertiary-container": "#003118",
                      "surface-dim": "#131313",
                      "on-primary-fixed-variant": "#70343e",
                      "outline-variant": "#524345",
                      "inverse-primary": "#8c4b55",
                      "secondary-container": "#4a4949",
                      "surface-tint": "#ffb2bc",
                      "surface-container-highest": "#353535",
                      "on-surface-variant": "#d7c1c3",
                      "tertiary": "#98d4a8",
                      "on-primary-container": "#4c1722",
                      "tertiary-fixed": "#b4f1c3",
                      "on-secondary-container": "#bab8b7",
                      "on-background": "#e2e2e2",
                      "outline": "#9f8c8e",
                      "surface-variant": "#353535",
                      "error": "#ffb4ab",
                      "on-tertiary-fixed": "#00210e",
                      "surface": "#131313",
                      "primary": "#ffb2bc",
                      "surface-container-high": "#2a2a2a",
                      "on-tertiary": "#00391d",
                      "background": "#131313",
                      "primary-container": "#c77b86",
                      "error-container": "#93000a",
                      "primary-fixed-dim": "#ffb2bc",
                      "on-secondary-fixed": "#1c1b1b",
                      "surface-container-lowest": "#0e0e0e",
                      "on-primary-fixed": "#3a0915"
              },
              "fontFamily": {
                      "label-md": ["Inter"],
                      "headline-lg-mobile": ["Oswald"],
                      "headline-md": ["Oswald"],
                      "display-lg": ["Oswald"],
                      "body-lg": ["Inter"],
                      "body-md": ["Inter"],
                      "headline-lg": ["Oswald"]
              }
            }
          }
        }
    </script>
    <style>
        body {
            background-color: #131313;
            color: #e2e2e2;
            -webkit-font-smoothing: antialiased;
            min-height: max(884px, 100dvh);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .glow-primary {
            box-shadow: 0 0 15px rgba(255, 178, 188, 0.3);
        }
        .scanner-line {
            animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
            0%, 100% { top: 0%; opacity: 0; }
            50% { top: 100%; opacity: 1; }
        }
        .shimmer {
            background: linear-gradient(90deg, transparent, rgba(255, 178, 188, 0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    </style>
</head>
<body class="font-body-md text-body-md overflow-x-hidden">

    <!-- Login Section -->
    <div id="login-section" class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <div class="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDglD7Dwdr6hs-yJ71lAUb1O4ISzuBnJzO722WaUUJQHc9OwpX3Voh915eplCa1rZcFQMUKfI9_ebonizdYTO19wM9JPrKdQHqSgRhU36EaXitjEwXH5quZ9-HqWE4_KfPficVZXJxn3ZbPGytvio0qCGEUg861gDBJe1eX6FXiBtwk9zXMBJ6qXYJDrsOABBg-oSzXijAmfGfcUnU87x3kntcTmjc3OQJKKbk_-q9ucNzuV2vd0QpM95qV9vkLw94bThCdnPSgKP0')] bg-cover mix-blend-overlay"></div>
            
            <div class="relative z-10">
                <h2 class="font-headline-md text-headline-md text-primary tracking-wider uppercase mb-2 text-center">OD Club Scanner</h2>
                <p class="text-on-surface-variant font-label-md text-center mb-6">Login with your credentials.</p>
                
                <div id="login-alert" class="hidden mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center"></div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                        <input type="email" id="adminEmail" required placeholder="Enter your email"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
                        <input type="password" id="adminPassword" required placeholder="Enter your password"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    </div>
                    <div class="text-right">
                        <button type="button" id="reset-password-btn" class="text-sm text-primary hover:underline">Forgot Password?</button>
                    </div>
                    <button type="submit" id="login-btn" 
                            class="w-full mt-6 bg-primary text-on-primary font-headline-md text-lg py-3 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all glow-primary">
                        Login
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Dashboard Section -->
    <div id="dashboard-section" class="hidden">
        <!-- Top App Bar -->
        <header class="bg-background fixed top-0 left-0 w-full z-50 border-b border-outline-variant/30">
            <div class="flex justify-between items-center px-6 md:px-12 py-4 w-full max-w-7xl mx-auto">
                <div class="flex items-center gap-4">
                    <span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform" data-icon="fitness_center">fitness_center</span>
                    <h1 class="font-headline-md text-headline-md tracking-wider text-primary uppercase">OD Club</h1>
                </div>
                <div class="flex items-center gap-4">
                    <button id="logout-btn" class="text-on-surface-variant hover:text-primary transition-colors font-label-md uppercase tracking-wider flex items-center gap-2">
                        <span class="material-symbols-outlined text-xl" data-icon="logout">logout</span>
                        <span class="hidden md:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>

        <main class="pt-24 pb-32 min-h-screen px-4 md:px-12 max-w-7xl mx-auto">
            <!-- Header Section -->
            <div class="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 class="font-headline-lg-mobile md:font-headline-lg text-primary uppercase tracking-tight mb-2">Gym Entry Scanner</h2>
                    <p class="text-on-surface-variant font-label-md max-w-md">Verify digital member IDs within the rose gold frame to authorize access to the Nexus facilities.</p>
                </div>
                <div id="status-alert" class="hidden px-4 py-3 rounded border font-medium text-sm"></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                <!-- Left Side: Scanner Camera Container -->
                <div class="lg:col-span-7 flex flex-col gap-4">
                    <!-- Scanner View -->
                    <div class="w-full aspect-square md:aspect-video relative rounded-2xl overflow-hidden bg-black border border-outline-variant/20 shadow-[0_0_20px_rgba(255,178,188,0.1)]">
                        <!-- Camera Feed -->
                        <div class="absolute inset-0 z-0 flex items-center justify-center bg-surface-container-lowest">
                            <video id="webcam" autoplay playsinline class="w-full h-full object-cover transform scale-x-[-1]"></video>
                        </div>
                        
                        <!-- Scanning Overlay -->
                        <div class="absolute inset-0 z-10 flex items-center justify-center p-12 pointer-events-none">
                            <div class="relative w-full h-full max-w-sm aspect-square border-2 border-dashed border-primary/50 rounded-3xl flex items-center justify-center">
                                <div class="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl"></div>
                                <div class="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl"></div>
                                <div class="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl"></div>
                                <div class="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl"></div>
                                
                                <!-- Animated Scan Line -->
                                <div class="scanner-line absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent blur-[2px]"></div>
                            </div>
                        </div>

                        <!-- HUD Elements -->
                        <div class="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end pointer-events-none">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2 text-primary">
                                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    <span class="font-label-md tracking-tighter uppercase">Nexus Live Feed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search and QR Reader -->
                    <div class="bg-surface-container border border-outline-variant/20 rounded-xl p-4">
                        <form id="member-search-form" class="flex gap-2 mb-4">
                            <input type="text" id="member-id-input" placeholder="Enter Member ID (e.g. GYM001)" required
                                   class="flex-1 bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                            <button type="submit" class="bg-primary/10 border border-primary/30 text-primary px-6 rounded-lg font-headline-md uppercase tracking-wider hover:bg-primary/20 transition-colors">
                                Load
                            </button>
                        </form>
                        <div id="qr-reader" class="w-full rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-lowest"></div>
                    </div>
                </div>

                <!-- Right Side: Member ID & Status -->
                <div class="lg:col-span-5 space-y-6">
                    
                    <div id="no-member-selected" class="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 text-center h-[300px] flex flex-col items-center justify-center text-on-surface-variant transition-all">
                        <span class="material-symbols-outlined text-4xl mb-4 opacity-50" data-icon="search">search</span>
                        <p class="font-label-md uppercase tracking-wider">Awaiting Scan or Input</p>
                    </div>

                    <!-- Member ID Card -->
                    <div id="verification-content" class="hidden">
                        <div class="bg-surface-container-lowest border-t-2 border-primary rounded-xl p-6 relative overflow-hidden group hover:glow-primary transition-all duration-500 mb-6">
                            <div class="shimmer absolute inset-0 opacity-10 pointer-events-none"></div>
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h3 class="font-headline-md text-headline-md text-on-surface leading-tight uppercase" id="member-name-display">--</h3>
                                    <p class="text-on-surface-variant font-label-md" id="member-id-display">--</p>
                                </div>
                                <span class="material-symbols-outlined text-primary text-4xl" data-icon="workspace_premium" data-weight="fill" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
                            </div>

                            <div class="space-y-6">
                                <div class="pt-4 border-t border-outline-variant/20 flex gap-4">
                                    <div class="flex-1 text-center">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">Database Profile</p>
                                        <div class="aspect-square rounded-lg overflow-hidden border border-primary/40 p-0.5 bg-background">
                                            <img id="ref-photo" src="" alt="Reference Photo" class="w-full h-full object-cover rounded-md">
                                        </div>
                                    </div>
                                    <div class="flex-1 text-center">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">Live Capture</p>
                                        <div class="aspect-square rounded-lg overflow-hidden border border-outline-variant/40 p-0.5 bg-background relative">
                                            <canvas id="live-canvas" class="hidden"></canvas>
                                            <img id="live-capture-img" src="https://via.placeholder.com/150?text=Pending" alt="Live Capture" class="w-full h-full object-cover rounded-md transform scale-x-[-1]">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-3">
                            <button id="capture-btn" class="w-full bg-surface-container-highest text-on-surface border border-outline-variant/30 font-headline-md text-lg py-3 rounded-lg uppercase tracking-widest hover:bg-surface-bright transition-all flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined">photo_camera</span> Capture Snapshot
                            </button>
                            
                            <button id="confirm-entry-btn" disabled class="w-full bg-primary text-on-primary font-headline-md text-lg py-4 rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100">
                                Confirm & Check-in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Script Logic from Original -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const loginSection = document.getElementById('login-section');
            const dashboardSection = document.getElementById('dashboard-section');
            const loginForm = document.getElementById('login-form');
            const loginAlert = document.getElementById('login-alert');
            const logoutBtn = document.getElementById('logout-btn');

            const memberSearchForm = document.getElementById('member-search-form');
            const memberIdInput = document.getElementById('member-id-input');
            
            const noMemberSelected = document.getElementById('no-member-selected');
            const verificationContent = document.getElementById('verification-content');
            const memberNameDisplay = document.getElementById('member-name-display');
            const memberIdDisplay = document.getElementById('member-id-display');
            const refPhoto = document.getElementById('ref-photo');
            const captureBtn = document.getElementById('capture-btn');
            const confirmEntryBtn = document.getElementById('confirm-entry-btn');
            const statusAlert = document.getElementById('status-alert');

            let camera = null;
            let currentMember = null;
            let capturedPhotoBase64 = null;
            let qrScanner = null;

            function customShowAlert(elementId, msg, type = 'error') {
                const el = document.getElementById(elementId);
                el.textContent = msg;
                el.className = `mb-4 p-3 rounded font-medium text-sm text-center ${type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container/20 text-tertiary-fixed border border-tertiary-fixed/30'}`;
                el.classList.remove('hidden');
            }

            function customHideAlert(elementId) {
                document.getElementById(elementId).classList.add('hidden');
            }

            // Auth Check
            auth.onAuthStateChanged(user => {
                if (user) {
                    loginSection.classList.add('hidden');
                    dashboardSection.classList.remove('hidden');
                    startQRScanner();
                    initCamera();
                } else {
                    loginSection.classList.remove('hidden');
                    dashboardSection.classList.add('hidden');
                    stopAllMedia();
                }
            });

            // Login submit
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (typeof auth === 'undefined' || !auth) {
                    customShowAlert('login-alert', "Firebase Auth is not initialized.", 'error');
                    return;
                }
                
                const email = document.getElementById('adminEmail').value.trim();
                const password = document.getElementById('adminPassword').value.trim();
                const btn = document.getElementById('login-btn');
                
                btn.disabled = true;
                btn.textContent = 'Logging in...';
                customHideAlert('login-alert');
                
                try {
                    await loginOrSignup(email, password);
                    customShowAlert('login-alert', 'Login successful! Redirecting...', 'success');
                    setTimeout(() => customHideAlert('login-alert'), 1000);
                } catch (err) {
                    console.error("Login failed:", err);
                    customShowAlert('login-alert', err.message || 'Login failed. Please check credentials.');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Login';
                }
            });

            const resetPasswordBtn = document.getElementById('reset-password-btn');
            if (resetPasswordBtn) {
                resetPasswordBtn.addEventListener('click', async () => {
                    const email = document.getElementById('adminEmail').value.trim();
                    if (!email) {
                        customShowAlert('login-alert', 'Please enter your email to reset password.', 'error');
                        return;
                    }
                    try {
                        await auth.sendPasswordResetEmail(email);
                        customShowAlert('login-alert', 'Password reset email sent! Check your inbox.', 'success');
                    } catch (err) {
                        console.error("Reset failed:", err);
                        customShowAlert('login-alert', err.message || 'Failed to send reset email.', 'error');
                    }
                });
            }

            logoutBtn.addEventListener('click', () => auth.signOut());

            async function initCamera() {
                const video = document.getElementById('webcam');
                const canvas = document.getElementById('live-canvas');
                camera = new ScannerCamera(video, canvas);
                await camera.start();
            }

            function stopAllMedia() {
                if (camera) camera.stop();
                if (qrScanner) {
                    qrScanner.clear().catch(err => console.error("Error clearing QR:", err));
                }
            }

            function startQRScanner() {
                qrScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
                qrScanner.render((decodedText) => {
                    memberIdInput.value = decodedText;
                    loadMember(decodedText);
                }, () => {});
            }

            // Form Search Load
            memberSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                loadMember(memberIdInput.value.trim());
            });

            async function loadMember(memberId) {
                customHideAlert('status-alert');
                confirmEntryBtn.disabled = true;
                capturedPhotoBase64 = null;
                
                const liveImg = document.getElementById('live-capture-img');
                if (liveImg) liveImg.src = 'https://via.placeholder.com/150?text=Pending';

                try {
                    const doc = await db.collection('members').doc(memberId).get();
                    if (!doc.exists) {
                        customShowAlert('status-alert', `Member ${memberId} not found.`, 'error');
                        noMemberSelected.classList.remove('hidden');
                        verificationContent.classList.add('hidden');
                        return;
                    }

                    const member = doc.data();
                    currentMember = { id: doc.id, ...member };
                    
                    memberNameDisplay.textContent = member.name;
                    memberIdDisplay.textContent = `ID: ${doc.id} â€¢ ${member.phone}`;
                    refPhoto.src = member.photoUrl || 'https://via.placeholder.com/150?text=No+Photo';

                    const todayStr = new Date().toISOString().split('T')[0];
                    const existingCheckin = await db.collection('entries')
                        .where('memberId', '==', doc.id)
                        .where('date', '==', todayStr)
                        .where('entryType', '==', 'gym')
                        .get();

                    noMemberSelected.classList.add('hidden');
                    verificationContent.classList.remove('hidden');

                    if (existingCheckin.size > 0) {
                        customShowAlert('status-alert', `Member already checked in to Gym today.`, 'error');
                        confirmEntryBtn.disabled = true;
                        confirmEntryBtn.textContent = 'Already Checked In';
                    } else {
                        confirmEntryBtn.disabled = true;
                        confirmEntryBtn.textContent = 'Capture Photo to Confirm';
                    }
                } catch (err) {
                    console.error("Error loading member:", err);
                    customShowAlert('status-alert', `Error: ${err.message}`, 'error');
                }
            }

            // Capture Snapshot
            captureBtn.addEventListener('click', () => {
                if (camera) {
                    capturedPhotoBase64 = camera.capture();
                    if (capturedPhotoBase64) {
                        const liveImg = document.getElementById('live-capture-img');
                        if (liveImg) liveImg.src = capturedPhotoBase64;
                        
                        if (confirmEntryBtn.textContent !== 'Already Checked In') {
                            confirmEntryBtn.disabled = false;
                            confirmEntryBtn.textContent = 'Confirm & Check-in';
                        }
                    }
                }
            });

            // Confirm Entry
            confirmEntryBtn.addEventListener('click', async () => {
                if (!currentMember || !capturedPhotoBase64) return;
                
                confirmEntryBtn.disabled = true;
                confirmEntryBtn.textContent = 'Processing...';

                try {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const timestamp = Date.now();
                    const livePhotoPath = `live_photos/gym_${currentMember.id}_${timestamp}.jpg`;
                    const storageRef = storage.ref(livePhotoPath);
                    
                    const snapshot = await storageRef.putString(capturedPhotoBase64, 'data_url');
                    const livePhotoUrl = await snapshot.ref.getDownloadURL();

                    await db.collection('entries').add({
                        memberId: currentMember.id,
                        memberName: currentMember.name,
                        photoUrl: currentMember.photoUrl || '',
                        livePhotoUrl: livePhotoUrl,
                        entryType: 'gym',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        date: todayStr
                    });

                    customShowAlert('status-alert', `Check-in successful for ${currentMember.name}!`, 'success');
                    
                    setTimeout(() => {
                        noMemberSelected.classList.remove('hidden');
                        verificationContent.classList.add('hidden');
                        memberIdInput.value = '';
                        customHideAlert('status-alert');
                    }, 2000);

                } catch (err) {
                    console.error("Error confirming checkin:", err);
                    customShowAlert('status-alert', `Failed: ${err.message}`, 'error');
                    confirmEntryBtn.disabled = false;
                    confirmEntryBtn.textContent = 'Confirm & Check-in';
                }
            });
        });
    </script>
</body>
</html>

``n
## gamezone-scanner.html

`$lang
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Game Zone Scanner | OD Club</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    
    <!-- Firebase CDN -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
    <script src="/js/firebase-config.js"></script>
    <script src="/js/scanner-common.js"></script>
    <!-- html5-qrcode for scanning -->
    <script src="https://unpkg.com/html5-qrcode"></script>

    <script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary-fixed-variant": "#474646",
                      "tertiary-container": "#649d75",
                      "on-error-container": "#ffdad6",
                      "secondary-fixed": "#e5e2e1",
                      "tertiary-fixed-dim": "#98d4a8",
                      "surface-container": "#1f1f1f",
                      "primary-fixed": "#ffd9dd",
                      "on-primary": "#551e29",
                      "surface-bright": "#393939",
                      "on-error": "#690005",
                      "surface-container-low": "#1b1b1b",
                      "inverse-on-surface": "#303030",
                      "secondary": "#c9c6c5",
                      "on-tertiary-fixed-variant": "#16512f",
                      "secondary-fixed-dim": "#c9c6c5",
                      "on-surface": "#e2e2e2",
                      "inverse-surface": "#e2e2e2",
                      "on-secondary": "#313030",
                      "on-tertiary-container": "#003118",
                      "surface-dim": "#131313",
                      "on-primary-fixed-variant": "#70343e",
                      "outline-variant": "#524345",
                      "inverse-primary": "#8c4b55",
                      "secondary-container": "#4a4949",
                      "surface-tint": "#ffb2bc",
                      "surface-container-highest": "#353535",
                      "on-surface-variant": "#d7c1c3",
                      "tertiary": "#98d4a8",
                      "on-primary-container": "#4c1722",
                      "tertiary-fixed": "#b4f1c3",
                      "on-secondary-container": "#bab8b7",
                      "on-background": "#e2e2e2",
                      "outline": "#9f8c8e",
                      "surface-variant": "#353535",
                      "error": "#ffb4ab",
                      "on-tertiary-fixed": "#00210e",
                      "surface": "#131313",
                      "primary": "#ffb2bc",
                      "surface-container-high": "#2a2a2a",
                      "on-tertiary": "#00391d",
                      "background": "#131313",
                      "primary-container": "#c77b86",
                      "error-container": "#93000a",
                      "primary-fixed-dim": "#ffb2bc",
                      "on-secondary-fixed": "#1c1b1b",
                      "surface-container-lowest": "#0e0e0e",
                      "on-primary-fixed": "#3a0915"
              },
              "fontFamily": {
                      "label-md": ["Inter"],
                      "headline-lg-mobile": ["Oswald"],
                      "headline-md": ["Oswald"],
                      "display-lg": ["Oswald"],
                      "body-lg": ["Inter"],
                      "body-md": ["Inter"],
                      "headline-lg": ["Oswald"]
              }
            }
          }
        }
    </script>
    <style>
        body {
            background-color: #131313;
            color: #e2e2e2;
            -webkit-font-smoothing: antialiased;
            min-height: max(884px, 100dvh);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .glow-primary {
            box-shadow: 0 0 15px rgba(255, 178, 188, 0.3);
        }
        .scanner-line {
            animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
            0%, 100% { top: 0%; opacity: 0; }
            50% { top: 100%; opacity: 1; }
        }
        .shimmer {
            background: linear-gradient(90deg, transparent, rgba(255, 178, 188, 0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    </style>
</head>
<body class="font-body-md text-body-md overflow-x-hidden">

    <!-- Login Section -->
    <div id="login-section" class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <div class="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDglD7Dwdr6hs-yJ71lAUb1O4ISzuBnJzO722WaUUJQHc9OwpX3Voh915eplCa1rZcFQMUKfI9_ebonizdYTO19wM9JPrKdQHqSgRhU36EaXitjEwXH5quZ9-HqWE4_KfPficVZXJxn3ZbPGytvio0qCGEUg861gDBJe1eX6FXiBtwk9zXMBJ6qXYJDrsOABBg-oSzXijAmfGfcUnU87x3kntcTmjc3OQJKKbk_-q9ucNzuV2vd0QpM95qV9vkLw94bThCdnPSgKP0')] bg-cover mix-blend-overlay"></div>
            
            <div class="relative z-10">
                <h2 class="font-headline-md text-headline-md text-primary tracking-wider uppercase mb-2 text-center">OD Club Scanner</h2>
                <p class="text-on-surface-variant font-label-md text-center mb-6">Login with your credentials.</p>
                
                <div id="login-alert" class="hidden mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center"></div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                        <input type="email" id="adminEmail" required placeholder="Enter your email"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
                        <input type="password" id="adminPassword" required placeholder="Enter your password"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    </div>
                    <div class="text-right">
                        <button type="button" id="reset-password-btn" class="text-sm text-primary hover:underline">Forgot Password?</button>
                    </div>
                    <button type="submit" id="login-btn" 
                            class="w-full mt-6 bg-primary text-on-primary font-headline-md text-lg py-3 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all glow-primary">
                        Login
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Dashboard Section -->
    <div id="dashboard-section" class="hidden">
        <!-- Top App Bar -->
        <header class="bg-background fixed top-0 left-0 w-full z-50 border-b border-outline-variant/30">
            <div class="flex justify-between items-center px-6 md:px-12 py-4 w-full max-w-7xl mx-auto">
                <div class="flex items-center gap-4">
                    <span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform" data-icon="sports_esports">sports_esports</span>
                    <h1 class="font-headline-md text-headline-md tracking-wider text-primary uppercase">OD Club</h1>
                </div>
                <div class="flex items-center gap-4">
                    <button id="logout-btn" class="text-on-surface-variant hover:text-primary transition-colors font-label-md uppercase tracking-wider flex items-center gap-2">
                        <span class="material-symbols-outlined text-xl" data-icon="logout">logout</span>
                        <span class="hidden md:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>

        <main class="pt-24 pb-32 min-h-screen px-4 md:px-12 max-w-7xl mx-auto">
            <!-- Header Section -->
            <div class="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 class="font-headline-lg-mobile md:font-headline-lg text-primary uppercase tracking-tight mb-2">Game Zone Scanner</h2>
                    <p class="text-on-surface-variant font-label-md max-w-md">Verify digital member IDs within the rose gold frame to authorize access to the Nexus Game Zone.</p>
                </div>
                <div id="status-alert" class="hidden px-4 py-3 rounded border font-medium text-sm"></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                <!-- Left Side: Scanner Camera Container -->
                <div class="lg:col-span-7 flex flex-col gap-4">
                    <!-- Scanner View -->
                    <div class="w-full aspect-square md:aspect-video relative rounded-2xl overflow-hidden bg-black border border-outline-variant/20 shadow-[0_0_20px_rgba(255,178,188,0.1)]">
                        <!-- Camera Feed -->
                        <div class="absolute inset-0 z-0 flex items-center justify-center bg-surface-container-lowest">
                            <video id="webcam" autoplay playsinline class="w-full h-full object-cover transform scale-x-[-1]"></video>
                        </div>
                        
                        <!-- Scanning Overlay -->
                        <div class="absolute inset-0 z-10 flex items-center justify-center p-12 pointer-events-none">
                            <div class="relative w-full h-full max-w-sm aspect-square border-2 border-dashed border-primary/50 rounded-3xl flex items-center justify-center">
                                <div class="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl"></div>
                                <div class="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl"></div>
                                <div class="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl"></div>
                                <div class="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl"></div>
                                
                                <!-- Animated Scan Line -->
                                <div class="scanner-line absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent blur-[2px]"></div>
                            </div>
                        </div>

                        <!-- HUD Elements -->
                        <div class="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end pointer-events-none">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2 text-primary">
                                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    <span class="font-label-md tracking-tighter uppercase">Nexus Live Feed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search and QR Reader -->
                    <div class="bg-surface-container border border-outline-variant/20 rounded-xl p-4">
                        <form id="member-search-form" class="flex gap-2 mb-4">
                            <input type="text" id="member-id-input" placeholder="Enter Member ID (e.g. GYM001)" required
                                   class="flex-1 bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                            <button type="submit" class="bg-primary/10 border border-primary/30 text-primary px-6 rounded-lg font-headline-md uppercase tracking-wider hover:bg-primary/20 transition-colors">
                                Load
                            </button>
                        </form>
                        <div id="qr-reader" class="w-full rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-lowest"></div>
                    </div>
                </div>

                <!-- Right Side: Member ID & Status -->
                <div class="lg:col-span-5 space-y-6">
                    
                    <div id="no-member-selected" class="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 text-center h-[300px] flex flex-col items-center justify-center text-on-surface-variant transition-all">
                        <span class="material-symbols-outlined text-4xl mb-4 opacity-50" data-icon="search">search</span>
                        <p class="font-label-md uppercase tracking-wider">Awaiting Scan or Input</p>
                    </div>

                    <!-- Member ID Card -->
                    <div id="verification-content" class="hidden">
                        <div class="bg-surface-container-lowest border-t-2 border-primary rounded-xl p-6 relative overflow-hidden group hover:glow-primary transition-all duration-500 mb-6">
                            <div class="shimmer absolute inset-0 opacity-10 pointer-events-none"></div>
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h3 class="font-headline-md text-headline-md text-on-surface leading-tight uppercase" id="member-name-display">--</h3>
                                    <p class="text-on-surface-variant font-label-md" id="member-id-display">--</p>
                                </div>
                                <span class="material-symbols-outlined text-primary text-4xl" data-icon="sports_esports" data-weight="fill" style="font-variation-settings: 'FILL' 1;">sports_esports</span>
                            </div>

                            <div class="space-y-6">
                                <div class="pt-4 border-t border-outline-variant/20 flex gap-4">
                                    <div class="flex-1 text-center">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">Database Profile</p>
                                        <div class="aspect-square rounded-lg overflow-hidden border border-primary/40 p-0.5 bg-background">
                                            <img id="ref-photo" src="" alt="Reference Photo" class="w-full h-full object-cover rounded-md">
                                        </div>
                                    </div>
                                    <div class="flex-1 text-center">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">Live Capture</p>
                                        <div class="aspect-square rounded-lg overflow-hidden border border-outline-variant/40 p-0.5 bg-background relative">
                                            <canvas id="live-canvas" class="hidden"></canvas>
                                            <img id="live-capture-img" src="https://via.placeholder.com/150?text=Pending" alt="Live Capture" class="w-full h-full object-cover rounded-md transform scale-x-[-1]">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-3">
                            <button id="capture-btn" class="w-full bg-surface-container-highest text-on-surface border border-outline-variant/30 font-headline-md text-lg py-3 rounded-lg uppercase tracking-widest hover:bg-surface-bright transition-all flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined">photo_camera</span> Capture Snapshot
                            </button>
                            
                            <button id="confirm-entry-btn" disabled class="w-full bg-primary text-on-primary font-headline-md text-lg py-4 rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100">
                                Confirm & Check-in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Script Logic from Original -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const loginSection = document.getElementById('login-section');
            const dashboardSection = document.getElementById('dashboard-section');
            const loginForm = document.getElementById('login-form');
            const loginAlert = document.getElementById('login-alert');
            const logoutBtn = document.getElementById('logout-btn');

            const memberSearchForm = document.getElementById('member-search-form');
            const memberIdInput = document.getElementById('member-id-input');
            
            const noMemberSelected = document.getElementById('no-member-selected');
            const verificationContent = document.getElementById('verification-content');
            const memberNameDisplay = document.getElementById('member-name-display');
            const memberIdDisplay = document.getElementById('member-id-display');
            const refPhoto = document.getElementById('ref-photo');
            const captureBtn = document.getElementById('capture-btn');
            const confirmEntryBtn = document.getElementById('confirm-entry-btn');
            const statusAlert = document.getElementById('status-alert');

            let camera = null;
            let currentMember = null;
            let capturedPhotoBase64 = null;
            let qrScanner = null;

            function customShowAlert(elementId, msg, type = 'error') {
                const el = document.getElementById(elementId);
                el.textContent = msg;
                el.className = `mb-4 p-3 rounded font-medium text-sm text-center ${type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container/20 text-tertiary-fixed border border-tertiary-fixed/30'}`;
                el.classList.remove('hidden');
            }

            function customHideAlert(elementId) {
                document.getElementById(elementId).classList.add('hidden');
            }

            // Auth Check
            auth.onAuthStateChanged(user => {
                if (user) {
                    loginSection.classList.add('hidden');
                    dashboardSection.classList.remove('hidden');
                    startQRScanner();
                    initCamera();
                } else {
                    loginSection.classList.remove('hidden');
                    dashboardSection.classList.add('hidden');
                    stopAllMedia();
                }
            });

            // Login submit
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (typeof auth === 'undefined' || !auth) {
                    customShowAlert('login-alert', "Firebase Auth is not initialized.", 'error');
                    return;
                }
                
                const email = document.getElementById('adminEmail').value.trim();
                const password = document.getElementById('adminPassword').value.trim();
                const btn = document.getElementById('login-btn');
                
                btn.disabled = true;
                btn.textContent = 'Logging in...';
                customHideAlert('login-alert');
                
                try {
                    await loginOrSignup(email, password);
                    customShowAlert('login-alert', 'Login successful! Redirecting...', 'success');
                    setTimeout(() => customHideAlert('login-alert'), 1000);
                } catch (err) {
                    console.error("Login failed:", err);
                    customShowAlert('login-alert', err.message || 'Login failed. Please check credentials.');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Login';
                }
            });

            const resetPasswordBtn = document.getElementById('reset-password-btn');
            if (resetPasswordBtn) {
                resetPasswordBtn.addEventListener('click', async () => {
                    const email = document.getElementById('adminEmail').value.trim();
                    if (!email) {
                        customShowAlert('login-alert', 'Please enter your email to reset password.', 'error');
                        return;
                    }
                    try {
                        await auth.sendPasswordResetEmail(email);
                        customShowAlert('login-alert', 'Password reset email sent! Check your inbox.', 'success');
                    } catch (err) {
                        console.error("Reset failed:", err);
                        customShowAlert('login-alert', err.message || 'Failed to send reset email.', 'error');
                    }
                });
            }

            logoutBtn.addEventListener('click', () => auth.signOut());

            async function initCamera() {
                const video = document.getElementById('webcam');
                const canvas = document.getElementById('live-canvas');
                camera = new ScannerCamera(video, canvas);
                await camera.start();
            }

            function stopAllMedia() {
                if (camera) camera.stop();
                if (qrScanner) {
                    qrScanner.clear().catch(err => console.error("Error clearing QR:", err));
                }
            }

            function startQRScanner() {
                qrScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
                qrScanner.render((decodedText) => {
                    memberIdInput.value = decodedText;
                    loadMember(decodedText);
                }, () => {});
            }

            // Form Search Load
            memberSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                loadMember(memberIdInput.value.trim());
            });

            async function loadMember(memberId) {
                customHideAlert('status-alert');
                confirmEntryBtn.disabled = true;
                capturedPhotoBase64 = null;
                
                const liveImg = document.getElementById('live-capture-img');
                if (liveImg) liveImg.src = 'https://via.placeholder.com/150?text=Pending';

                try {
                    const doc = await db.collection('members').doc(memberId).get();
                    if (!doc.exists) {
                        customShowAlert('status-alert', `Member ${memberId} not found.`, 'error');
                        noMemberSelected.classList.remove('hidden');
                        verificationContent.classList.add('hidden');
                        return;
                    }

                    const member = doc.data();
                    currentMember = { id: doc.id, ...member };
                    
                    memberNameDisplay.textContent = member.name;
                    memberIdDisplay.textContent = `ID: ${doc.id} â€¢ ${member.phone}`;
                    refPhoto.src = member.photoUrl || 'https://via.placeholder.com/150?text=No+Photo';

                    const todayStr = new Date().toISOString().split('T')[0];
                    const existingCheckin = await db.collection('entries')
                        .where('memberId', '==', doc.id)
                        .where('date', '==', todayStr)
                        .where('entryType', '==', 'gamezone') // Changed to gamezone
                        .get();

                    noMemberSelected.classList.add('hidden');
                    verificationContent.classList.remove('hidden');

                    if (existingCheckin.size > 0) {
                        customShowAlert('status-alert', `Member already checked in to Game Zone today.`, 'error');
                        confirmEntryBtn.disabled = true;
                        confirmEntryBtn.textContent = 'Already Checked In';
                    } else {
                        confirmEntryBtn.disabled = true;
                        confirmEntryBtn.textContent = 'Capture Photo to Confirm';
                    }
                } catch (err) {
                    console.error("Error loading member:", err);
                    customShowAlert('status-alert', `Error: ${err.message}`, 'error');
                }
            }

            // Capture Snapshot
            captureBtn.addEventListener('click', () => {
                if (camera) {
                    capturedPhotoBase64 = camera.capture();
                    if (capturedPhotoBase64) {
                        const liveImg = document.getElementById('live-capture-img');
                        if (liveImg) liveImg.src = capturedPhotoBase64;
                        
                        if (confirmEntryBtn.textContent !== 'Already Checked In') {
                            confirmEntryBtn.disabled = false;
                            confirmEntryBtn.textContent = 'Confirm & Check-in';
                        }
                    }
                }
            });

            // Confirm Entry
            confirmEntryBtn.addEventListener('click', async () => {
                if (!currentMember || !capturedPhotoBase64) return;
                
                confirmEntryBtn.disabled = true;
                confirmEntryBtn.textContent = 'Processing...';

                try {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const timestamp = Date.now();
                    const livePhotoPath = `live_photos/gamezone_${currentMember.id}_${timestamp}.jpg`; // Changed to gamezone
                    const storageRef = storage.ref(livePhotoPath);
                    
                    const snapshot = await storageRef.putString(capturedPhotoBase64, 'data_url');
                    const livePhotoUrl = await snapshot.ref.getDownloadURL();

                    await db.collection('entries').add({
                        memberId: currentMember.id,
                        memberName: currentMember.name,
                        photoUrl: currentMember.photoUrl || '',
                        livePhotoUrl: livePhotoUrl,
                        entryType: 'gamezone', // Changed to gamezone
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        date: todayStr
                    });

                    customShowAlert('status-alert', `Check-in successful for ${currentMember.name}!`, 'success');
                    
                    setTimeout(() => {
                        noMemberSelected.classList.remove('hidden');
                        verificationContent.classList.add('hidden');
                        memberIdInput.value = '';
                        customHideAlert('status-alert');
                    }, 2000);

                } catch (err) {
                    console.error("Error confirming checkin:", err);
                    customShowAlert('status-alert', `Failed: ${err.message}`, 'error');
                    confirmEntryBtn.disabled = false;
                    confirmEntryBtn.textContent = 'Confirm & Check-in';
                }
            });
        });
    </script>
</body>
</html>

``n
## clubowner.html

`$lang
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>OD Club | Owner Panel</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    
    <!-- Chart.js for Graphs -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Firebase CDN -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
    <script src="/js/firebase-config.js"></script>
    <script src="/js/scanner-common.js"></script>
    <!-- jsPDF for Report Export -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js"></script>

    <style>
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        .glow-primary { box-shadow: 0 0 15px rgba(255, 178, 188, 0.3); }
        .rose-gold-border { border: 1px solid rgba(183, 110, 121, 0.2); }
        .rose-gold-divider { border-bottom: 1px solid rgba(183, 110, 121, 0.1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #131313; }
        ::-webkit-scrollbar-thumb { background: #B76E79; border-radius: 10px; }
        body { min-height: max(884px, 100dvh); }
        .tab-content.hidden { display: none; }
        
        /* Table styles for legacy tabs to match theme */
        .theme-table th, .theme-table td { padding: 1rem; border-bottom: 1px solid rgba(183, 110, 121, 0.2); }
        .theme-table th { font-family: 'Oswald'; color: #ffb2bc; text-transform: uppercase; }
        .theme-table tr:hover { background-color: rgba(255, 178, 188, 0.05); }
    </style>
    <script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                "on-secondary-fixed-variant": "#474646", "tertiary-container": "#649d75", "on-error-container": "#ffdad6",
                "surface-container": "#1f1f1f", "on-primary": "#551e29", "surface-bright": "#393939",
                "on-error": "#690005", "surface-container-low": "#1b1b1b", "inverse-on-surface": "#303030",
                "on-surface": "#e2e2e2", "inverse-surface": "#e2e2e2", "surface-dim": "#131313",
                "outline-variant": "#524345", "surface-tint": "#ffb2bc", "surface-container-highest": "#353535",
                "on-surface-variant": "#d7c1c3", "tertiary": "#98d4a8", "on-background": "#e2e2e2",
                "outline": "#9f8c8e", "surface-variant": "#353535", "error": "#ffb4ab",
                "surface": "#131313", "primary": "#ffb2bc", "surface-container-high": "#2a2a2a",
                "background": "#131313", "error-container": "#93000a", "surface-container-lowest": "#0e0e0e"
              },
              "fontFamily": {
                "label-md": ["Inter"], "headline-lg-mobile": ["Oswald"], "headline-md": ["Oswald"],
                "display-lg": ["Oswald"], "body-lg": ["Inter"], "body-md": ["Inter"], "headline-lg": ["Oswald"]
              }
            }
          }
        }
    </script>
</head>
<body class="bg-background text-on-background font-body-md min-h-screen pb-24 md:pb-0">

    <!-- Login Section -->
    <div id="login-section" class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <div class="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDglD7Dwdr6hs-yJ71lAUb1O4ISzuBnJzO722WaUUJQHc9OwpX3Voh915eplCa1rZcFQMUKfI9_ebonizdYTO19wM9JPrKdQHqSgRhU36EaXitjEwXH5quZ9-HqWE4_KfPficVZXJxn3ZbPGytvio0qCGEUg861gDBJe1eX6FXiBtwk9zXMBJ6qXYJDrsOABBg-oSzXijAmfGfcUnU87x3kntcTmjc3OQJKKbk_-q9ucNzuV2vd0QpM95qV9vkLw94bThCdnPSgKP0')] bg-cover mix-blend-overlay"></div>
            
            <div class="relative z-10">
                <h2 class="font-headline-md text-headline-md text-primary tracking-wider uppercase mb-2 text-center">Owner Login</h2>
                <p class="text-on-surface-variant font-label-md text-center mb-6">Login with your credentials.</p>
                
                <div id="login-alert" class="hidden mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center"></div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                        <input type="email" id="ownerEmail" required placeholder="Enter your email"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
                        <input type="password" id="ownerPassword" required placeholder="Enter your password"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none">
                    </div>
                    <div class="text-right">
                        <button type="button" id="reset-password-btn" class="text-sm text-primary hover:underline">Forgot Password?</button>
                    </div>
                    <button type="submit" id="login-btn" class="w-full mt-6 bg-primary text-on-primary font-headline-md py-3 rounded-lg hover:brightness-110 glow-primary">Login</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Dashboard Section -->
    <div id="dashboard-section" class="hidden">
        <!-- TopAppBar -->
        <header class="bg-background border-b border-outline-variant/30 fixed w-full top-0 z-50">
            <div class="flex justify-between items-center px-8 py-2 w-full max-w-7xl mx-auto h-20">
                <div class="flex items-center gap-4">
                    <h1 class="font-headline-lg text-primary uppercase tracking-widest text-2xl">OD Club</h1>
                </div>
                <div class="flex items-center gap-6">
                    <div class="hidden md:flex gap-8 items-center mr-8 nav-tabs">
                        <div class="nav-tab active font-label-md text-primary cursor-pointer transition-all hover:glow-primary" data-tab="live-feed-tab">REAL-TIME FEED</div>
                        <div class="nav-tab font-label-md text-on-surface-variant cursor-pointer hover:text-primary transition-all" data-tab="members-tab">MEMBERS</div>
                        <div class="nav-tab font-label-md text-on-surface-variant cursor-pointer hover:text-primary transition-all" data-tab="reports-tab">REPORTS</div>
                    </div>
                    <button id="logout-btn" class="text-primary hover:scale-95 transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-8 py-28">
            <div id="status-alert" class="hidden mb-4 p-3 rounded font-medium text-sm"></div>

            <!-- Quick Stats Bento Grid (Visible across tabs) -->
            <section class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div class="bg-surface-container-low p-6 rose-gold-border rounded-lg group transition-all hover:bg-surface-container border-l-4 border-l-primary/50">
                    <p class="font-label-md text-on-surface-variant mb-2 text-sm">TOTAL MEMBERS</p>
                    <div class="flex items-baseline gap-2">
                        <span class="font-headline-lg text-3xl text-primary" id="stat-total-members">0</span>
                    </div>
                </div>
                <div class="bg-surface-container-low p-6 rose-gold-border rounded-lg group transition-all hover:bg-surface-container">
                    <p class="font-label-md text-on-surface-variant mb-2 text-sm">GYM ENTRIES TODAY</p>
                    <div class="flex items-baseline gap-2">
                        <span class="font-headline-lg text-3xl text-primary" id="gym-count">0</span>
                    </div>
                </div>
                <div class="bg-surface-container-low p-6 rose-gold-border rounded-lg group transition-all hover:bg-surface-container">
                    <p class="font-label-md text-on-surface-variant mb-2 text-sm">GAME ZONE TODAY</p>
                    <div class="flex items-baseline gap-2">
                        <span class="font-headline-lg text-3xl text-primary" id="gamezone-count">0</span>
                    </div>
                </div>
                <div class="bg-surface-container-low p-6 rose-gold-border rounded-lg group transition-all hover:bg-surface-container border-l-4 border-l-error">
                    <p class="font-label-md text-error mb-2 text-sm">SUSPICIOUS ALERTS</p>
                    <div class="flex items-baseline gap-2">
                        <span class="font-headline-lg text-3xl text-error" id="stat-alerts">0</span>
                    </div>
                </div>
            </section>

            <!-- LIVE FEED TAB -->
            <div id="live-feed-tab" class="tab-content block">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left: Analytics and Alerts -->
                    <div class="lg:col-span-5 space-y-6 flex flex-col">
                        <div class="bg-surface-container-low rose-gold-border rounded-lg p-6 flex-grow min-h-[300px] flex flex-col">
                            <h3 class="font-headline-md text-on-surface-variant uppercase mb-4">Entry Count (Last 7 Days)</h3>
                            <div class="flex-grow w-full relative">
                                <canvas id="entryChart"></canvas>
                            </div>
                        </div>
                        <div class="bg-surface-container-low rose-gold-border rounded-lg p-6 flex-grow border-t-2 border-t-error min-h-[250px]">
                            <h3 class="font-headline-md text-error uppercase mb-4 border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined">gavel</span> Suspicious Alerts
                            </h3>
                            <div class="overflow-y-auto max-h-[300px]">
                                <ul id="alerts-list" class="space-y-3">
                                    <li class="text-center text-on-surface-variant mt-8">No suspicious activity detected.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right: Live Feed -->
                    <div class="lg:col-span-7 bg-surface-container-low rose-gold-border rounded-lg">
                        <div class="p-8 border-b border-outline-variant/30 flex justify-between items-center">
                            <h3 class="font-headline-md text-primary uppercase tracking-widest">RECENT ARRIVALS</h3>
                        </div>
                        <div class="overflow-x-auto p-4">
                            <div id="live-feed-container" class="space-y-4 max-h-[600px] overflow-y-auto">
                                <div class="text-center text-muted p-8">No entry logs recorded today.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MEMBERS TAB -->
            <div id="members-tab" class="tab-content hidden">
                <div class="bg-surface-container-low rose-gold-border rounded-lg p-8">
                    <div class="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
                        <h3 class="font-headline-md text-primary uppercase">Manage Members</h3>
                        <button id="add-member-btn" class="bg-primary/20 text-primary px-4 py-2 rounded font-label-md border border-primary/30 hover:bg-primary/30">+ REGISTER</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table id="members-table" class="w-full text-left theme-table">
                            <thead>
                                <tr>
                                    <th>Photo</th><th>ID</th><th>Name</th><th>Phone</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="members-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- REPORTS TAB -->
            <div id="reports-tab" class="tab-content hidden">
                <div class="bg-surface-container-low rose-gold-border rounded-lg p-8">
                    <h3 class="font-headline-md text-primary uppercase mb-6 border-b border-outline-variant/30 pb-4">Reports</h3>
                    
                    <div class="flex flex-wrap gap-4 mb-8 bg-surface-container p-4 rounded-lg">
                        <div class="flex-1">
                            <label class="block text-sm text-on-surface-variant mb-1">From Date</label>
                            <input type="date" id="rep-from-date" class="w-full bg-background border border-outline-variant/50 rounded px-3 py-2 text-on-surface">
                        </div>
                        <div class="flex-1">
                            <label class="block text-sm text-on-surface-variant mb-1">To Date</label>
                            <input type="date" id="rep-to-date" class="w-full bg-background border border-outline-variant/50 rounded px-3 py-2 text-on-surface">
                        </div>
                        <div class="flex items-end">
                            <button id="rep-filter-btn" class="bg-primary text-on-primary px-6 py-2 rounded font-bold h-[42px]">Filter</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div class="p-4 border border-outline-variant/30 rounded bg-background">
                            <div class="text-sm text-on-surface-variant">Period Gym Entries</div>
                            <div id="rep-gym-count" class="text-2xl text-primary mt-1">0</div>
                        </div>
                        <div class="p-4 border border-outline-variant/30 rounded bg-background">
                            <div class="text-sm text-on-surface-variant">Period Game Zone</div>
                            <div id="rep-gamezone-count" class="text-2xl text-primary mt-1">0</div>
                        </div>
                        <div class="p-4 border border-outline-variant/30 rounded bg-background">
                            <div class="text-sm text-on-surface-variant">Most Visited Member</div>
                            <div id="rep-most-visited" class="text-lg text-primary mt-1 break-words">None</div>
                        </div>
                    </div>

                    <div class="flex gap-4 mb-8 border-b border-outline-variant/30 pb-6">
                        <button id="rep-export-pdf" class="bg-primary text-on-primary px-4 py-2 rounded">Download PDF Report</button>
                        <button id="rep-export-csv" class="bg-surface-container border border-primary/30 text-primary px-4 py-2 rounded">Download CSV Report</button>
                    </div>

                    <div class="space-y-8">
                        <div>
                            <h4 class="text-primary font-bold mb-4">Gym Entries (<span id="rep-gym-table-count">0</span>)</h4>
                            <table id="rep-gym-table" class="w-full text-left theme-table text-sm">
                                <thead><tr><th>Date</th><th>Name</th><th>ID</th><th>Time</th></tr></thead>
                                <tbody id="rep-gym-body"><tr><td colspan="4" class="text-center">No data</td></tr></tbody>
                            </table>
                        </div>
                        <div>
                            <h4 class="text-primary font-bold mb-4">Game Zone Entries (<span id="rep-gamezone-table-count">0</span>)</h4>
                            <table id="rep-gamezone-table" class="w-full text-left theme-table text-sm">
                                <thead><tr><th>Date</th><th>Name</th><th>ID</th><th>Time</th></tr></thead>
                                <tbody id="rep-gamezone-body"><tr><td colspan="4" class="text-center">No data</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Member Modal -->
    <div id="member-modal" class="hidden fixed inset-0 z-[1000] bg-black/80 flex justify-center items-center p-4 backdrop-blur-sm">
        <div class="bg-surface-container border border-outline-variant/30 p-8 rounded-2xl w-full max-w-lg">
            <h2 id="modal-title" class="font-headline-md text-primary text-2xl mb-6">Register New Member</h2>
            <form id="member-modal-form" class="space-y-4">
                <div>
                    <label class="block text-sm text-on-surface-variant mb-1">Member ID</label>
                    <input type="text" id="m-id" required class="w-full bg-background border border-outline-variant/50 rounded px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm text-on-surface-variant mb-1">Full Name</label>
                    <input type="text" id="m-name" required class="w-full bg-background border border-outline-variant/50 rounded px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm text-on-surface-variant mb-1">Phone</label>
                    <input type="tel" id="m-phone" required class="w-full bg-background border border-outline-variant/50 rounded px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm text-on-surface-variant mb-1">Photo</label>
                    <input type="file" id="m-photo" accept="image/*" required class="w-full bg-background border border-outline-variant/50 rounded px-3 py-2 text-sm">
                </div>
                <div class="flex gap-4 mt-8">
                    <button type="submit" id="save-member-btn" class="bg-primary text-on-primary px-6 py-2 rounded">Save</button>
                    <button type="button" id="cancel-modal-btn" class="border border-outline-variant/50 px-6 py-2 rounded">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script src="/js/clubowner.js"></script>
    <script>
        // Override nav-tab functionality since clubowner.js handles it minimally, let's make it robust for tailwind
        document.addEventListener('DOMContentLoaded', () => {
            const tabs = document.querySelectorAll('.nav-tab');
            const contents = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const target = tab.getAttribute('data-tab');
                    
                    tabs.forEach(t => {
                        t.classList.remove('active', 'text-primary');
                        t.classList.add('text-on-surface-variant');
                        t.style.borderBottom = 'none';
                    });
                    
                    tab.classList.add('active', 'text-primary');
                    tab.classList.remove('text-on-surface-variant');
                    
                    contents.forEach(c => {
                        if(c.id === target) {
                            c.classList.remove('hidden');
                            c.classList.add('block');
                        } else {
                            c.classList.add('hidden');
                            c.classList.remove('block');
                        }
                    });
                });
            });

            // Reset password logic
            const resetPasswordBtn = document.getElementById('reset-password-btn');
            if (resetPasswordBtn) {
                resetPasswordBtn.addEventListener('click', async () => {
                    const email = document.getElementById('ownerEmail').value.trim();
                    const alertEl = document.getElementById('login-alert');
                    if (!email) {
                        alertEl.textContent = 'Please enter your email to reset password.';
                        alertEl.className = 'mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center';
                        alertEl.classList.remove('hidden');
                        return;
                    }
                    try {
                        await firebase.auth().sendPasswordResetEmail(email);
                        alertEl.textContent = 'Password reset email sent! Check your inbox.';
                        alertEl.className = 'mb-4 p-3 rounded bg-tertiary-container/20 text-tertiary-fixed border border-tertiary-fixed/30 text-sm text-center';
                        alertEl.classList.remove('hidden');
                    } catch (err) {
                        console.error("Reset failed:", err);
                        alertEl.textContent = err.message || 'Failed to send reset email.';
                        alertEl.className = 'mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center';
                        alertEl.classList.remove('hidden');
                    }
                });
            }
        });
    </script>
</body>
</html>
``n
## js\firebase-config.js

`$lang
const firebaseConfig = {
  apiKey: "AIzaSyCncwyKk-uFuXnLRSE9ZUqf8OrM5DRZyzo",
  authDomain: "dreamclubapp-5647c.firebaseapp.com",
  projectId: "dreamclubapp-5647c",
  storageBucket: "dreamclubapp-5647c.firebasestorage.app",
  messagingSenderId: "583959640571",
  appId: "1:583959640571:web:5f6e6aa09e3c3ce080735e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure phone auth language
auth.useDeviceLanguage();

``n
## js\scanner-common.js

`$lang
// Common scanner utilities for dreamclubapp

// Helper to log in or automatically create account on first attempt
async function loginOrSignup(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return userCredential.user;
      } catch (signupError) {
        throw signupError;
      }
    }
    throw error;
  }
}

// Camera Helper Class
class ScannerCamera {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.stream = null;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', true);
      this.video.play();
      return true;
    } catch (err) {
      console.error("Camera access error:", err);
      return false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
  }

  capture() {
    if (!this.video || !this.canvas) return null;
    const context = this.canvas.getContext('2d');
    this.canvas.width = this.video.videoWidth || 320;
    this.canvas.height = this.video.videoHeight || 240;
    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL('image/jpeg', 0.85);
  }
}

// Alert utility helper
function showAlert(containerId, message, type = 'error') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.textContent = message;
  container.className = `alert alert-${type}`;
  container.classList.remove('hidden');
}

function hideAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.add('hidden');
  }
}

``n
## js\clubowner.js

`$lang
document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginAlert = document.getElementById('login-alert');
    const logoutBtn = document.getElementById('logout-btn');
    
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const liveFeedContainer = document.getElementById('live-feed-container');
    const membersBody = document.getElementById('members-body');
    
    const addMemberBtn = document.getElementById('add-member-btn');
    const memberModal = document.getElementById('member-modal');
    const memberModalForm = document.getElementById('member-modal-form');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');

    const gymCountVal = document.getElementById('gym-count');
    const gamezoneCountVal = document.getElementById('gamezone-count');
    const statMembers = document.getElementById('stat-total-members');
    const statAlerts = document.getElementById('stat-alerts');
    const alertsList = document.getElementById('alerts-list');

    let unsubscribeEntries = null;
    let unsubscribeMembers = null;
    let unsubscribeAllEntries = null;
    let entryChart = null;
    let editMode = false;
    let editMemberId = null;
    let currentPhotoUrl = null;

    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        if (user) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            
            // Start Real-Time Listeners
            initDashboardListeners();
        } else {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            
            // Stop Listeners
            if (unsubscribeEntries) unsubscribeEntries();
            if (unsubscribeMembers) unsubscribeMembers();
            if (unsubscribeAllEntries) unsubscribeAllEntries();
            if (entryChart) {
                entryChart.destroy();
                entryChart = null;
            }
        }
    });

    // Login Form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('ownerEmail').value.trim();
        const password = document.getElementById('ownerPassword').value.trim();
        const btn = document.getElementById('login-btn');
        
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        
        try {
            await loginOrSignup(email, password);
            hideAlert('login-alert');
        } catch (err) {
            showAlert('login-alert', err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    // --- Tab Navigation ---
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.remove('hidden');
            
            if (tab.dataset.tab === 'reports-tab') {
                generateReport();
            }
        });
    });

    // --- Real-time Listeners ---
    function initDashboardListeners() {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Listen for Today's Entries (Gym and Gamezone)
        unsubscribeEntries = db.collection('entries')
            .where('date', '==', todayStr)
            .onSnapshot(snapshot => {
                let gymCount = 0;
                let gamezoneCount = 0;
                let alertCount = 0;
                liveFeedContainer.innerHTML = '';
                if (alertsList) alertsList.innerHTML = '';

                if (snapshot.empty) {
                    liveFeedContainer.innerHTML = `
                        <div class="text-center text-muted" style="padding: 3rem 0;">
                            No entry logs recorded today.
                        </div>
                    `;
                } else {
                    // Sort entries client-side by timestamp descending to avoid composite index requirement
                    const docs = [];
                    snapshot.forEach(doc => docs.push(doc));
                    docs.sort((a, b) => {
                        const tA = a.data().timestamp ? (a.data().timestamp.toDate ? a.data().timestamp.toDate().getTime() : a.data().timestamp) : 0;
                        const tB = b.data().timestamp ? (b.data().timestamp.toDate ? b.data().timestamp.toDate().getTime() : b.data().timestamp) : 0;
                        return tB - tA;
                    });

                    docs.forEach(doc => {
                        const data = doc.data();
                        const time = data.timestamp ? new Date(data.timestamp.toDate()) : new Date();
                        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        if (data.entryType === 'gym') gymCount++;
                        if (data.entryType === 'gamezone') gamezoneCount++;

                        const feedItem = document.createElement('div');
                        feedItem.className = 'feed-item';
                        
                        const badgeClass = data.entryType === 'gym' ? 'badge badge-gym' : 'badge badge-game';
                        const entryTypeLabel = data.entryType === 'gym' ? 'Gym' : 'Game Zone';
                        
                        feedItem.innerHTML = `
                            <div class="feed-photos">
                                <div style="text-align: center;">
                                    <img class="feed-photo" src="${data.photoUrl || 'https://via.placeholder.com/50?text=No+Photo'}" alt="Ref">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Profile</div>
                                </div>
                                <div style="text-align: center;">
                                    <img class="feed-photo" src="${data.livePhotoUrl || 'https://via.placeholder.com/50?text=No+Live'}" alt="Live">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Live</div>
                                </div>
                            </div>
                            <div class="feed-details">
                                <div style="font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                                    ${data.memberName}
                                    <span class="${badgeClass}">${entryTypeLabel}</span>
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    Member ID: <strong>${data.memberId}</strong>
                                </div>
                            </div>
                            <div class="feed-time" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                                <span>${timeStr}</span>
                                <button class="action-btn delete-entry" data-id="${doc.id}" style="color: var(--accent-color); font-size: 0.75rem; border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 4px; padding: 0.2rem 0.5rem; background: rgba(220, 38, 38, 0.05);">Delete</button>
                            </div>
                        `;
                        liveFeedContainer.appendChild(feedItem);

                        // Check for suspicious off-hours check-in (12 AM to 4 AM)
                        const hour = time.getHours();
                        if (hour >= 0 && hour < 4) {
                            alertCount++;
                            if (alertsList) {
                                const li = document.createElement('li');
                                li.style.padding = '0.75rem';
                                li.style.borderBottom = '1px solid rgba(183, 110, 121, 0.2)';
                                li.innerHTML = `
                                    <div style="color: #ffb4ab; font-weight: bold; margin-bottom: 0.25rem;">Off-hours Check-in</div>
                                    <div style="font-size: 0.85rem; color: #d7c1c3;">Member <strong>${data.memberName}</strong> (${data.memberId}) checked in at ${time.toLocaleTimeString()} to ${entryTypeLabel}.</div>
                                `;
                                alertsList.appendChild(li);
                            }
                        }
                    });

                    // Re-bind actions for deleting entries
                    document.querySelectorAll('.delete-entry').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            deleteEntry(e.target.dataset.id);
                        });
                    });
                }

                if (gymCountVal) gymCountVal.textContent = gymCount;
                if (gamezoneCountVal) gamezoneCountVal.textContent = gamezoneCount;
                
                if (alertsList && alertCount === 0) {
                    alertsList.innerHTML = '<li class="text-center text-on-surface-variant mt-8">No suspicious activity detected.</li>';
                }
                if (statAlerts) statAlerts.textContent = alertCount;
            }, err => {
                console.error("Owner Entries listener error:", err);
            });

        // 2. Listen for Members List
        unsubscribeMembers = db.collection('members')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if (statMembers) statMembers.textContent = snapshot.size;
                membersBody.innerHTML = '';
                if (snapshot.empty) {
                    membersBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No members found.</td></tr>';
                } else {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>
                                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--border-color); overflow: hidden;">
                                    ${data.photoUrl ? `<img src="${data.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;font-size:0.8rem;color:#666;">No</div>'}
                                </div>
                            </td>
                            <td>${doc.id}</td>
                            <td>${data.name}</td>
                            <td>${data.phone}</td>
                            <td>
                                <button class="action-btn edit-member" data-id="${doc.id}" style="color: var(--text-color); margin-right: 0.5rem;">Edit</button>
                                <button class="action-btn delete-member" data-id="${doc.id}" style="color: var(--text-muted);">Delete</button>
                            </td>
                        `;
                        membersBody.appendChild(tr);
                    });

                    // Re-bind actions
                    document.querySelectorAll('.delete-member').forEach(btn => {
                        btn.addEventListener('click', (e) => deleteMember(e.target.dataset.id));
                    });
                    document.querySelectorAll('.edit-member').forEach(btn => {
                        btn.addEventListener('click', (e) => editMember(e.target.dataset.id));
                    });
                }
            }, err => {
                console.error("Owner Members listener error:", err);
            });
            
        // 3. Load last 7 days entries list for Chart.js
        renderChart();
    }

    // --- Chart Data Calculations ---
    function renderChart() {
        const canvas = document.getElementById('entryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (typeof Chart === 'undefined') return;
        
        Chart.defaults.color = '#d7c1c3';
        Chart.defaults.font.family = "'Inter', sans-serif";

        const dates = [];
        const labels = [];
        const values = [];

        // Build list of last 7 dates
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dates.push(dateStr);
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            values.push(0);
        }

        // Initialize Chart
        entryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Check-ins',
                    data: values,
                    backgroundColor: '#ffb2bc',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(183, 110, 121, 0.1)' },
                        ticks: { precision: 0 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // Listen for all entries in last 7 days to dynamically populate chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        unsubscribeAllEntries = db.collection('entries')
            .where('timestamp', '>=', sevenDaysAgo)
            .onSnapshot(snapshot => {
                const counts = Array(7).fill(0);
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const index = dates.indexOf(data.date);
                    if (index !== -1) {
                        counts[index]++;
                    }
                });

                if (entryChart) {
                    entryChart.data.datasets[0].data = counts;
                    entryChart.update();
                }
            }, err => console.error("Chart data subscription error:", err));
    }

    // --- Modal Registration / Edit ---
    addMemberBtn.addEventListener('click', () => {
        editMode = false;
        editMemberId = null;
        currentPhotoUrl = null;
        
        document.getElementById('modal-title').textContent = 'Register New Member';
        document.getElementById('m-id').disabled = false;
        document.getElementById('m-photo').required = true;
        
        memberModalForm.reset();
        memberModal.classList.remove('hidden');
    });

    cancelModalBtn.addEventListener('click', () => {
        memberModal.classList.add('hidden');
    });

    async function editMember(id) {
        try {
            const doc = await db.collection('members').doc(id).get();
            if (!doc.exists) return;
            
            const data = doc.data();
            editMode = true;
            editMemberId = id;
            currentPhotoUrl = data.photoUrl;
            
            document.getElementById('modal-title').textContent = `Edit Member: ${id}`;
            document.getElementById('m-id').value = id;
            document.getElementById('m-id').disabled = true;
            document.getElementById('m-name').value = data.name;
            document.getElementById('m-phone').value = data.phone;
            document.getElementById('m-photo').required = false; // Optional when editing
            document.getElementById('m-photo').value = '';
            
            memberModal.classList.remove('hidden');
        } catch (error) {
            console.error("Error loading member for edit:", error);
            alert("Error loading member details: " + error.message);
        }
    }

    memberModalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-member-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const id = editMode ? editMemberId : document.getElementById('m-id').value.trim();
        const name = document.getElementById('m-name').value.trim();
        const phone = document.getElementById('m-phone').value.trim();
        const photoFile = document.getElementById('m-photo').files[0];
        
        try {
            let photoUrl = currentPhotoUrl;
            
            if (!editMode && !photoFile) {
                alert("A profile photo is mandatory!");
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Member';
                return;
            }

            if (!editMode) {
                // Check if ID already exists (only in add mode)
                const doc = await db.collection('members').doc(id).get();
                if (doc.exists) {
                    alert("A member with this ID already exists!");
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save Member';
                    return;
                }
            }

            // Upload profile photo if a new one is selected
            if (photoFile) {
                const storageRef = storage.ref(`members/${id}.jpg`);
                const uploadTask = await storageRef.put(photoFile);
                photoUrl = await uploadTask.ref.getDownloadURL();
            }

            // Set/Update document
            const memberData = {
                name: name,
                phone: phone,
                photoUrl: photoUrl,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!editMode) {
                memberData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('members').doc(id).set(memberData);
            } else {
                await db.collection('members').doc(id).update(memberData);
            }
            
            memberModal.classList.add('hidden');
        } catch (error) {
            console.error("Error saving member:", error);
            alert("Error saving member: " + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Member';
        }
    });

    async function deleteMember(id) {
        if (confirm(`Are you sure you want to delete member ${id}?`)) {
            try {
                // Delete photo from storage if exists
                try {
                    await storage.ref(`members/${id}.jpg`).delete();
                } catch (e) {
                    // Suppress error if file didn't exist in storage
                }
                await db.collection('members').doc(id).delete();
            } catch (error) {
                console.error("Error deleting member:", error);
                alert("Error deleting member: " + error.message);
            }
        }
    }

    async function deleteEntry(id) {
        if (confirm("Are you sure you want to delete this check-in entry?")) {
            try {
                await db.collection('entries').doc(id).delete();
            } catch (error) {
                console.error("Error deleting entry:", error);
                alert("Error deleting entry: " + error.message);
            }
        }
    }

    // --- Reports Functionality ---
    window.currentGymReportEntries = [];
    window.currentGamezoneReportEntries = [];
    window.currentReportFromDate = '';
    window.currentReportToDate = '';

    // Initialize date inputs for Reports using timezone-safe local date strings
    const todayObj = new Date();
    const lastWeekObj = new Date(todayObj.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const toDateStr = todayObj.toLocaleDateString('en-CA');
    const fromDateStr = lastWeekObj.toLocaleDateString('en-CA');
    
    const repFromInput = document.getElementById('rep-from-date');
    const repToInput = document.getElementById('rep-to-date');
    
    if (repFromInput) repFromInput.value = fromDateStr;
    if (repToInput) repToInput.value = toDateStr;

    async function generateReport() {
        const fromDate = document.getElementById('rep-from-date').value;
        const toDate = document.getElementById('rep-to-date').value;
        
        if (!fromDate || !toDate) {
            alert("Please select both From and To dates.");
            return;
        }
        
        if (fromDate > toDate) {
            alert("From Date cannot be later than To Date.");
            return;
        }
        
        const filterBtn = document.getElementById('rep-filter-btn');
        if (filterBtn) {
            filterBtn.disabled = true;
            filterBtn.textContent = 'Filtering...';
        }
        
        try {
            const snapshot = await db.collection('entries')
                .where('date', '>=', fromDate)
                .where('date', '<=', toDate)
                .get();
                
            let gymEntries = [];
            let gamezoneEntries = [];
            let memberVisits = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const entry = {
                    id: doc.id,
                    date: data.date,
                    time: data.time || '',
                    memberId: data.memberId,
                    memberName: data.memberName || 'Unknown',
                    entryType: data.entryType
                };
                
                if (data.entryType === 'gym') {
                    gymEntries.push(entry);
                } else if (data.entryType === 'gamezone') {
                    gamezoneEntries.push(entry);
                }
                
                if (data.memberId) {
                    if (!memberVisits[data.memberId]) {
                        memberVisits[data.memberId] = {
                            name: data.memberName || 'Unknown',
                            count: 0
                        };
                    }
                    memberVisits[data.memberId].count++;
                }
            });
            
            // Sort by date then time descending in JS
            const sortFn = (a, b) => {
                if (a.date !== b.date) {
                    return b.date.localeCompare(a.date);
                }
                return b.time.localeCompare(a.time);
            };
            gymEntries.sort(sortFn);
            gamezoneEntries.sort(sortFn);
            
            // Update Stats
            document.getElementById('rep-gym-count').textContent = gymEntries.length;
            document.getElementById('rep-gamezone-count').textContent = gamezoneEntries.length;
            
            // Find most visited member
            let mostVisitedName = "None";
            let maxVisits = 0;
            for (const id in memberVisits) {
                if (memberVisits[id].count > maxVisits) {
                    maxVisits = memberVisits[id].count;
                    mostVisitedName = `${memberVisits[id].name} (${id}) - ${maxVisits} visits`;
                }
            }
            document.getElementById('rep-most-visited').textContent = mostVisitedName;
            
            // Render Gym Table
            const gymBody = document.getElementById('rep-gym-body');
            document.getElementById('rep-gym-table-count').textContent = gymEntries.length;
            gymBody.innerHTML = '';
            if (gymEntries.length === 0) {
                gymBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No gym entries found for this period.</td></tr>';
            } else {
                gymEntries.forEach(e => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${e.date}</td>
                        <td>${e.memberName}</td>
                        <td>${e.memberId}</td>
                        <td>${e.time}</td>
                    `;
                    gymBody.appendChild(tr);
                });
            }
            
            // Render Game Zone Table
            const gzBody = document.getElementById('rep-gamezone-body');
            document.getElementById('rep-gamezone-table-count').textContent = gamezoneEntries.length;
            gzBody.innerHTML = '';
            if (gamezoneEntries.length === 0) {
                gzBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No game zone entries found for this period.</td></tr>';
            } else {
                gamezoneEntries.forEach(e => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${e.date}</td>
                        <td>${e.memberName}</td>
                        <td>${e.memberId}</td>
                        <td>${e.time}</td>
                    `;
                    gzBody.appendChild(tr);
                });
            }
            
            // Store current entries in global variables for export
            window.currentGymReportEntries = gymEntries;
            window.currentGamezoneReportEntries = gamezoneEntries;
            window.currentReportFromDate = fromDate;
            window.currentReportToDate = toDate;
            
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Error generating report: " + error.message);
        } finally {
            if (filterBtn) {
                filterBtn.disabled = false;
                filterBtn.textContent = 'Filter';
            }
        }
    }

    function exportCSVReport() {
        const gymEntries = window.currentGymReportEntries || [];
        const gzEntries = window.currentGamezoneReportEntries || [];
        const fromDate = window.currentReportFromDate || '';
        const toDate = window.currentReportToDate || '';
        
        if (gymEntries.length === 0 && gzEntries.length === 0) {
            alert("No data available to export. Please run a filter first.");
            return;
        }
        
        let csvContent = "\ufeff"; // BOM for UTF-8
        
        // Gym Section
        csvContent += `GYM ENTRIES REPORT (${fromDate} to ${toDate})\n`;
        csvContent += "Date,Member Name,Member ID,Entry Time\n";
        gymEntries.forEach(e => {
            csvContent += `"${e.date}","${e.memberName}","${e.memberId}","${e.time}"\n`;
        });
        
        csvContent += "\n";
        
        // Game Zone Section
        csvContent += `GAME ZONE ENTRIES REPORT (${fromDate} to ${toDate})\n`;
        csvContent += "Date,Member Name,Member ID,Entry Time\n";
        gzEntries.forEach(e => {
            csvContent += `"${e.date}","${e.memberName}","${e.memberId}","${e.time}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `DreamClub_Report_${fromDate}_to_${toDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportPDFReport() {
        const gymEntries = window.currentGymReportEntries || [];
        const gzEntries = window.currentGamezoneReportEntries || [];
        const fromDate = window.currentReportFromDate || '';
        const toDate = window.currentReportToDate || '';
        
        if (gymEntries.length === 0 && gzEntries.length === 0) {
            alert("No data available to export. Please run a filter first.");
            return;
        }
        
        if (typeof window.jspdf === 'undefined') {
            alert("PDF Export library is loading, please try again in a moment.");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("DREAM CLUB - ENTRY REPORT", 14, 22);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Period: ${fromDate} to ${toDate}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
        
        // Summary stats
        doc.setFont("helvetica", "bold");
        doc.text(`Total Gym Entries: ${gymEntries.length}`, 14, 46);
        doc.text(`Total Game Zone Entries: ${gzEntries.length}`, 14, 52);
        
        // Most Visited Member
        const mostVisited = document.getElementById('rep-most-visited').textContent;
        doc.text(`Most Visited: ${mostVisited}`, 14, 58);
        
        let currentY = 68;
        
        // Gym Table
        if (gymEntries.length > 0) {
            doc.setFontSize(14);
            doc.text("Gym Entries", 14, currentY);
            const gymRows = gymEntries.map(e => [e.date, e.memberName, e.memberId, e.time]);
            doc.autoTable({
                startY: currentY + 4,
                head: [['Date', 'Member Name', 'Member ID', 'Entry Time']],
                body: gymRows,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] },
                styles: { fontSize: 10 }
            });
            currentY = doc.lastAutoTable.finalY + 15;
        } else {
            doc.setFontSize(14);
            doc.text("Gym Entries: None", 14, currentY);
            currentY += 15;
        }
        
        // Game Zone Table
        if (gzEntries.length > 0) {
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }
            doc.setFontSize(14);
            doc.text("Game Zone Entries", 14, currentY);
            const gzRows = gzEntries.map(e => [e.date, e.memberName, e.memberId, e.time]);
            doc.autoTable({
                startY: currentY + 4,
                head: [['Date', 'Member Name', 'Member ID', 'Entry Time']],
                body: gzRows,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] },
                styles: { fontSize: 10 }
            });
        } else {
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }
            doc.setFontSize(14);
            doc.text("Game Zone Entries: None", 14, currentY);
        }
        
        doc.save(`DreamClub_Report_${fromDate}_to_${toDate}.pdf`);
    }

    // Attach event listeners
    const repFilterBtn = document.getElementById('rep-filter-btn');
    if (repFilterBtn) repFilterBtn.addEventListener('click', generateReport);
    
    const repExportCsv = document.getElementById('rep-export-csv');
    if (repExportCsv) repExportCsv.addEventListener('click', exportCSVReport);
    
    const repExportPdf = document.getElementById('rep-export-pdf');
    if (repExportPdf) repExportPdf.addEventListener('click', exportPDFReport);
});

``n

