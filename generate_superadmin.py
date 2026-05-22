import os

html_content = """<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Elite Nexus | Super Admin Dashboard</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet"/>
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
        }
        .bento-card:hover { border-top-color: #ffb2bc; box-shadow: 0 0 20px rgba(183, 110, 121, 0.1); }
        .rose-gold-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(183, 110, 121, 0.2), transparent); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        .theme-table th, .theme-table td { padding: 1rem; border-bottom: 1px solid rgba(183, 110, 121, 0.2); }
        .theme-table th { font-family: 'Oswald'; color: #ffb2bc; text-transform: uppercase; }
        .theme-table tr:hover { background-color: rgba(255, 178, 188, 0.05); }
    </style>
</head>
<body class="flex flex-col min-h-screen">

    <!-- Login Section -->
    <div id="login-section" class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <div class="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDglD7Dwdr6hs-yJ71lAUb1O4ISzuBnJzO722WaUUJQHc9OwpX3Voh915eplCa1rZcFQMUKfI9_ebonizdYTO19wM9JPrKdQHqSgRhU36EaXitjEwXH5quZ9-HqWE4_KfPficVZXJxn3ZbPGytvio0qCGEUg861gDBJe1eX6FXiBtwk9zXMBJ6qXYJDrsOABBg-oSzXijAmfGfcUnU87x3kntcTmjc3OQJKKbk_-q9ucNzuV2vd0QpM95qV9vkLw94bThCdnPSgKP0')] bg-cover mix-blend-overlay"></div>
            
            <div class="relative z-10">
                <h2 class="font-headline-md text-primary tracking-wider uppercase mb-2 text-center">Super Admin</h2>
                <p class="text-on-surface-variant font-label-md text-center mb-6">Demo: superadmin@gym.com / superadmin123</p>
                
                <div id="login-alert" class="hidden mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center"></div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm text-on-surface-variant mb-1">Email</label>
                        <input type="email" id="saEmail" required value="superadmin@gym.com" 
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-on-surface-variant mb-1">Password</label>
                        <input type="password" id="saPassword" required value="superadmin123"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none">
                    </div>
                    <button type="submit" id="login-btn" class="w-full mt-6 bg-primary text-on-primary font-headline-md py-3 rounded-lg hover:brightness-110 glow-primary">Login</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Dashboard Section -->
    <div id="dashboard-section" class="hidden flex-grow flex flex-col">
        <!-- TopAppBar -->
        <header class="bg-background border-b border-outline-variant/30 sticky top-0 z-50">
            <div class="flex justify-between items-center px-8 py-2 w-full max-w-7xl mx-auto h-20">
                <div class="flex items-center gap-4">
                    <span class="material-symbols-outlined text-primary cursor-pointer hover:scale-95 duration-150">menu</span>
                    <h1 class="font-headline-lg text-primary uppercase tracking-widest text-2xl">ELITE NEXUS SUPERADMIN</h1>
                </div>
                <div class="flex items-center gap-6">
                    <button id="logout-btn" class="font-label-md text-on-surface-variant uppercase tracking-widest hover:text-primary transition-all">Logout</button>
                </div>
            </div>
        </header>

        <main class="flex-grow w-full max-w-7xl mx-auto px-8 py-12">
            <!-- Hero Header -->
            <div class="mb-12 flex justify-between items-end">
                <div>
                    <h2 class="font-headline-lg text-on-surface uppercase mb-2 text-3xl">Nexus Command Center</h2>
                    <p class="font-body-md text-on-surface-variant tracking-wide text-sm">SYSTEM OVERRIDE: ACTIVE • CLEARANCE: SUPER ADMIN</p>
                </div>
            </div>

            <!-- Bento Grid Layout -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                <!-- Stats Overview -->
                <div class="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div class="bento-card p-6 flex flex-col justify-between h-48">
                        <div class="flex justify-between items-start">
                            <span class="material-symbols-outlined text-primary text-3xl">group</span>
                        </div>
                        <div>
                            <h3 class="font-label-md text-on-surface-variant uppercase mb-1">Total Members</h3>
                            <span class="font-display-lg text-on-surface text-4xl" id="stat-total-members">0</span>
                        </div>
                    </div>
                    
                    <div class="bento-card p-6 flex flex-col justify-between h-48">
                        <div class="flex justify-between items-start">
                            <span class="material-symbols-outlined text-primary text-3xl">how_to_reg</span>
                        </div>
                        <div>
                            <h3 class="font-label-md text-on-surface-variant uppercase mb-1">Check-ins Today</h3>
                            <span class="font-display-lg text-on-surface text-4xl" id="stat-today-checkins">0</span>
                        </div>
                    </div>

                    <div class="bento-card p-6 flex flex-col justify-between h-48 border-t-error">
                        <div class="flex justify-between items-start">
                            <span class="material-symbols-outlined text-error text-3xl">warning</span>
                        </div>
                        <div>
                            <h3 class="font-label-md text-error uppercase mb-1">Suspicious Alerts</h3>
                            <span class="font-display-lg text-error text-4xl" id="stat-alerts">0</span>
                        </div>
                    </div>
                </div>

                <!-- Chart Area Placeholder (We use Chart.js, so we keep the canvas) -->
                <div class="md:col-span-4 bento-card p-6 flex flex-col h-full">
                    <h3 class="font-label-md text-on-surface-variant uppercase mb-4">Entry Count (Last 7 Days)</h3>
                    <div class="flex-grow w-full relative">
                        <canvas id="entryChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Tables and Lists -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Live Entry Feed -->
                <div class="bento-card p-6">
                    <h3 class="font-headline-md text-primary uppercase mb-4 border-b border-outline-variant/30 pb-2">Live Entry Feed</h3>
                    <div class="overflow-y-auto max-h-[400px]">
                        <table class="w-full text-left theme-table text-sm">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Member ID</th>
                                    <th>Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="live-feed-body">
                                <tr><td colspan="4" class="text-center text-on-surface-variant py-4">No entry logs recorded today.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Suspicious Activity Alerts -->
                <div class="bento-card p-6 border-t-error">
                    <h3 class="font-headline-md text-error uppercase mb-4 border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined">gavel</span> Suspicious Activity Alerts
                    </h3>
                    <div class="overflow-y-auto max-h-[400px]">
                        <ul id="alerts-list" class="space-y-3">
                            <li class="text-center text-on-surface-variant mt-8">No suspicious activity detected.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="/js/superadmin.js"></script>
</body>
</html>"""

with open("superadmin.html", "w", encoding="utf-8") as f:
    f.write(html_content)
