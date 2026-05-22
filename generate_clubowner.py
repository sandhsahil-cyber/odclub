import os

html_content = """<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>ELITE NEXUS | Owner Panel</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    
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
                <p class="text-on-surface-variant font-label-md text-center mb-6">Demo: clubowner@gym.com / owner123</p>
                
                <div id="login-alert" class="hidden mb-4 p-3 rounded bg-error-container text-on-error-container text-sm text-center"></div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                        <input type="email" id="ownerEmail" required value="clubowner@gym.com" 
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
                        <input type="password" id="ownerPassword" required value="owner123"
                               class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none">
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
                    <h1 class="font-headline-lg text-primary uppercase tracking-widest text-2xl">ELITE NEXUS</h1>
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
            <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div class="bg-surface-container-low p-8 rose-gold-border rounded-lg group transition-all hover:bg-surface-container">
                    <p class="font-label-md text-on-surface-variant mb-2">TOTAL GYM ENTRIES</p>
                    <div class="flex items-baseline gap-2">
                        <span class="font-headline-lg text-4xl text-primary" id="gym-count">0</span>
                    </div>
                </div>
                <div class="bg-surface-container-low p-8 rose-gold-border rounded-lg group transition-all hover:bg-surface-container border-l-4 border-l-primary">
                    <p class="font-label-md text-on-surface-variant mb-2">TOTAL GAME ZONE ENTRIES</p>
                    <div class="flex items-baseline gap-2">
                        <span class="font-headline-lg text-4xl text-primary" id="gamezone-count">0</span>
                    </div>
                </div>
            </section>

            <!-- LIVE FEED TAB -->
            <div id="live-feed-tab" class="tab-content block">
                <div class="bg-surface-container-low rose-gold-border rounded-lg">
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
        });
    </script>
</body>
</html>"""

with open("clubowner.html", "w", encoding="utf-8") as f:
    f.write(html_content)
