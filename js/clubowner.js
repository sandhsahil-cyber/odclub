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

        // 4. Load Settings
        loadSettings();
    }

    async function loadSettings() {
        const doc = await db.collection('settings').doc('gymTiming').get()
        if (doc.exists) {
            const data = doc.data()
            document.getElementById('gym-open-time').value = data.gymOpen || '06:00'
            document.getElementById('gym-close-time').value = data.gymClose || '22:00'
            document.getElementById('gamezone-open-time').value = data.gamezoneOpen || '10:00'
            document.getElementById('gamezone-close-time').value = data.gamezoneClose || '22:00'
        }
    }

    document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
        await db.collection('settings').doc('gymTiming').update({
            gymOpen: document.getElementById('gym-open-time').value,
            gymClose: document.getElementById('gym-close-time').value,
            gamezoneOpen: document.getElementById('gamezone-open-time').value,
            gamezoneClose: document.getElementById('gamezone-close-time').value
        })
        const successMsg = document.getElementById('settings-success');
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 3000);
    });

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
                    entryType: data.entryType,
                    status: data.status || 'confirmed',
                    photoUrl: data.photoUrl || '',
                    livePhotoUrl: data.livePhotoUrl || ''
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
                gymBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No gym entries found for this period.</td></tr>';
            } else {
                gymEntries.forEach(e => {
                    const statusBadge = e.status === 'rejected' 
                        ? '<span class="bg-error/20 text-error px-2 py-1 rounded text-xs">Rejected</span>'
                        : '<span class="bg-primary/20 text-primary px-2 py-1 rounded text-xs">Confirmed</span>';
                    
                    const photosHtml = `
                        <div class="flex gap-2">
                            <div class="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30 flex items-center justify-center">
                                ${e.photoUrl ? `<img src="${e.photoUrl}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-sm opacity-50">person</span>'}
                            </div>
                            <div class="w-8 h-8 rounded-full overflow-hidden border border-primary flex items-center justify-center">
                                ${e.livePhotoUrl ? `<img src="${e.livePhotoUrl}" class="w-full h-full object-cover transform scale-x-[-1]">` : '<span class="material-symbols-outlined text-sm opacity-50">photo_camera</span>'}
                            </div>
                        </div>
                    `;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${e.date}</td>
                        <td>${e.time}</td>
                        <td>${photosHtml}</td>
                        <td>${e.memberName}</td>
                        <td>${e.memberId}</td>
                        <td>${statusBadge}</td>
                    `;
                    gymBody.appendChild(tr);
                });
            }
            
            // Render Game Zone Table
            const gzBody = document.getElementById('rep-gamezone-body');
            document.getElementById('rep-gamezone-table-count').textContent = gamezoneEntries.length;
            gzBody.innerHTML = '';
            if (gamezoneEntries.length === 0) {
                gzBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No game zone entries found for this period.</td></tr>';
            } else {
                gamezoneEntries.forEach(e => {
                    const statusBadge = e.status === 'rejected' 
                        ? '<span class="bg-error/20 text-error px-2 py-1 rounded text-xs">Rejected</span>'
                        : '<span class="bg-primary/20 text-primary px-2 py-1 rounded text-xs">Confirmed</span>';
                    
                    const photosHtml = `
                        <div class="flex gap-2">
                            <div class="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30 flex items-center justify-center">
                                ${e.photoUrl ? `<img src="${e.photoUrl}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-sm opacity-50">person</span>'}
                            </div>
                            <div class="w-8 h-8 rounded-full overflow-hidden border border-primary flex items-center justify-center">
                                ${e.livePhotoUrl ? `<img src="${e.livePhotoUrl}" class="w-full h-full object-cover transform scale-x-[-1]">` : '<span class="material-symbols-outlined text-sm opacity-50">photo_camera</span>'}
                            </div>
                        </div>
                    `;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${e.date}</td>
                        <td>${e.time}</td>
                        <td>${photosHtml}</td>
                        <td>${e.memberName}</td>
                        <td>${e.memberId}</td>
                        <td>${statusBadge}</td>
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
        csvContent += "Date,Time,Member Name,Member ID,Status\n";
        gymEntries.forEach(e => {
            csvContent += `"${e.date}","${e.time}","${e.memberName}","${e.memberId}","${e.status}"\n`;
        });
        
        csvContent += "\n";
        
        // Game Zone Section
        csvContent += `GAME ZONE ENTRIES REPORT (${fromDate} to ${toDate})\n`;
        csvContent += "Date,Time,Member Name,Member ID,Status\n";
        gzEntries.forEach(e => {
            csvContent += `"${e.date}","${e.time}","${e.memberName}","${e.memberId}","${e.status}"\n`;
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
            const gymRows = gymEntries.map(e => [e.date, e.time, e.memberName, e.memberId, e.status]);
            doc.autoTable({
                startY: currentY + 4,
                head: [['Date', 'Entry Time', 'Member Name', 'Member ID', 'Status']],
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
            const gzRows = gzEntries.map(e => [e.date, e.time, e.memberName, e.memberId, e.status]);
            doc.autoTable({
                startY: currentY + 4,
                head: [['Date', 'Entry Time', 'Member Name', 'Member ID', 'Status']],
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

    const btnWeekly = document.getElementById('rep-btn-weekly');
    if (btnWeekly) {
        btnWeekly.addEventListener('click', () => {
            const today = new Date();
            const past = new Date(today);
            past.setDate(past.getDate() - 7);
            document.getElementById('rep-from-date').value = past.toISOString().split('T')[0];
            document.getElementById('rep-to-date').value = today.toISOString().split('T')[0];
            generateReport();
        });
    }

    const btnMonthly = document.getElementById('rep-btn-monthly');
    if (btnMonthly) {
        btnMonthly.addEventListener('click', () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            document.getElementById('rep-from-date').value = firstDay.toISOString().split('T')[0];
            generateReport();
        });
    }
});
