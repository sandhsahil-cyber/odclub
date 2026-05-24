// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');

const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

const statPendingCount = document.getElementById('stat-pending-count');
const statTodayConfirmed = document.getElementById('stat-today-confirmed');
const pendingEmpty = document.getElementById('pending-empty');
const pendingGrid = document.getElementById('pending-grid');

let unsubscribePending = null;
let reportsChart = null;
let currentReportsData = [];

// Toast Function
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span> ${msg}`;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === AUTH ===
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        initDashboard();
    } else {
        loginContainer.classList.remove('hidden');
        dashboardContainer.classList.add('hidden');
        if (unsubscribePending) unsubscribePending();
    }
});

// === CHECK-IN LOGIC ===
let currentToken = null;
let pollingInterval = null;
let countdownInterval = null;

const sectionInput = document.getElementById('section-input');
const sectionQr = document.getElementById('section-qr');
const sectionSuccess = document.getElementById('section-success');
const sectionRejected = document.getElementById('section-rejected');

const errorAlert = document.getElementById('error-alert');
const memberIdInput = document.getElementById('member-id');
const btnSubmit = document.getElementById('btn-submit');
const checkinForm = document.getElementById('checkin-form');

const memberNameDisplay = document.getElementById('member-name-display');
const qrCanvas = document.getElementById('qr-canvas');
const countdownTimer = document.getElementById('countdown-timer');
const successMessage = document.getElementById('success-message');

function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.classList.remove('hidden');
}

function hideError() {
    errorAlert.classList.add('hidden');
}

checkinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    let memberId = memberIdInput.value.trim().toUpperCase();
    if (!memberId) return;

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Processing...';

    try {
        // Step 1: Check members collection
        const memberDoc = await db.collection('members').doc(memberId).get();
        if (!memberDoc.exists) {
            throw new Error('Member ID not found. Please contact reception.');
        }
        const memberData = memberDoc.data();
        const memberName = memberData.name;

        // Step 2: Check settings timing
        const settingsDoc = await db.collection('settings').doc('gymTiming').get();
        if (settingsDoc.exists) {
            const timings = settingsDoc.data();
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHour}:${currentMinute}`;
            
            let openTime = timings.gamezoneOpen;
            let closeTime = timings.gamezoneClose;

            if (openTime && closeTime) {
                if (currentTimeStr < openTime || currentTimeStr >= closeTime) {
                    throw new Error(`Facility is closed. Timing: ${openTime} to ${closeTime}`);
                }
            }
        }

        // Step 3: Check duplicate entry
        const todayStr = new Date().toISOString().split('T')[0];
        const entriesSnapshot = await db.collection('entries')
            .where('memberId', '==', memberId)
            .where('date', '==', todayStr)
            .where('entryType', '==', 'gamezone')
            .get();
        
        if (!entriesSnapshot.empty) {
            throw new Error('You have already checked in today!');
        }

        // Step 4: Check if pending checkin already exists
        const pendingSnapshot = await db.collection('pendingCheckins')
            .where('memberId', '==', memberId)
            .where('entryType', '==', 'gamezone')
            .where('status', 'in', ['active', 'photo_uploaded'])
            .get();
        
        if (!pendingSnapshot.empty) {
            throw new Error('A check-in is already pending. Please wait for admin.');
        }

        // Step 5: Create pendingCheckins document
        const expiresAtDate = new Date(Date.now() + 5 * 60 * 1000);
        const docRef = await db.collection('pendingCheckins').add({
            memberId: memberId,
            memberName: memberName,
            entryType: 'gamezone',
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiresAt: firebase.firestore.Timestamp.fromDate(expiresAtDate),
            uploadedPhotoUrl: ''
        });
        
        currentToken = docRef.id;

        // Step 6: Generate QR code
        const baseUrl = window.location.origin;
        const qrUrl = baseUrl + "/photo-upload.html?token=" + currentToken;
        QRCode.toCanvas(qrCanvas, qrUrl, { width: 250, margin: 2, color: { dark: '#131313', light: '#ffffff' } }, function (error) {
            if (error) console.error(error);
        });

        memberNameDisplay.textContent = memberName;
        sectionInput.classList.add('hidden');
        sectionQr.classList.remove('hidden');

        startCountdown(5 * 60);
        startPolling(memberName);

    } catch (err) {
        console.error(err);
        showError(err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Proceed';
    }
});

function startCountdown(seconds) {
    let timeLeft = seconds;
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
            if (pollingInterval) clearInterval(pollingInterval);
            
            if (currentToken) {
                db.collection('pendingCheckins').doc(currentToken).update({ status: 'expired' }).catch(e => console.log(e));
            }
            
            showError('QR Code Expired. Please try again.');
            sectionQr.classList.add('hidden');
            sectionInput.classList.remove('hidden');
            return;
        }
        
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        countdownTimer.textContent = `QR expires in: ${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}

function startPolling(memberName) {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        if (!currentToken) return;
        
        try {
            const doc = await db.collection('pendingCheckins').doc(currentToken).get();
            if (doc.exists) {
                const status = doc.data().status;
                
                if (status === 'used' || status === 'confirmed') {
                    clearInterval(pollingInterval);
                    if (countdownInterval) clearInterval(countdownInterval);
                    
                    sectionQr.classList.add('hidden');
                    sectionSuccess.classList.remove('hidden');
                    successMessage.textContent = `Welcome ${memberName}!`;
                    
                    setTimeout(resetCheckinPage, 3000);
                } 
                else if (status === 'rejected') {
                    clearInterval(pollingInterval);
                    if (countdownInterval) clearInterval(countdownInterval);
                    
                    sectionQr.classList.add('hidden');
                    sectionRejected.classList.remove('hidden');
                }
                else if (status === 'expired') {
                    clearInterval(pollingInterval);
                    if (countdownInterval) clearInterval(countdownInterval);
                    
                    showError('QR Code Expired. Please try again.');
                    sectionQr.classList.add('hidden');
                    sectionInput.classList.remove('hidden');
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, 3000);
}

function resetCheckinPage() {
    if (pollingInterval) clearInterval(pollingInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    
    currentToken = null;
    hideError();
    memberIdInput.value = '';
    
    sectionInput.classList.remove('hidden');
    sectionQr.classList.add('hidden');
    sectionSuccess.classList.add('hidden');
    sectionRejected.classList.add('hidden');
}

document.getElementById('btn-reset-checkin').addEventListener('click', resetCheckinPage);
document.getElementById('btn-restart-checkin').addEventListener('click', resetCheckinPage);

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const email = document.getElementById('adminEmail').value.trim();
    const pass = document.getElementById('adminPassword').value.trim();
    const btn = document.getElementById('btn-login');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Logging in...';
    
    try {
        await loginOrSignup(email, pass);
    } catch (err) {
        loginError.textContent = err.message;
        loginError.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<span>Access Terminal</span>';
    }
});

btnLogout.addEventListener('click', () => auth.signOut());

// === TABS ===
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        
        navTabs.forEach(t => {
            t.classList.remove('active', 'text-primary', 'border-b-2', 'border-primary');
            t.classList.add('text-on-surface-variant');
        });
        tab.classList.add('active', 'text-primary', 'border-b-2', 'border-primary');
        tab.classList.remove('text-on-surface-variant');
        
        tabContents.forEach(c => {
            if (c.id === target) {
                c.classList.remove('hidden');
                c.classList.add('block');
                if (target === 'tab-reports') loadReportsData('today'); // default load
            } else {
                c.classList.add('hidden');
                c.classList.remove('block');
            }
        });
    });
});

// === TAB 1: PENDING ===
function initDashboard() {
    if (unsubscribePending) unsubscribePending();
    
    unsubscribePending = db.collection('pendingCheckins')
        .where('entryType', '==', 'gamezone')
        .where('status', '==', 'photo_uploaded')
        .onSnapshot(async (snapshot) => {
            statPendingCount.textContent = snapshot.size;
            
            if (snapshot.empty) {
                pendingGrid.innerHTML = '';
                pendingGrid.classList.add('hidden');
                pendingEmpty.classList.remove('hidden');
                return;
            }
            
            pendingEmpty.classList.add('hidden');
            pendingGrid.classList.remove('hidden');
            pendingGrid.innerHTML = ''; // clear and rebuild

            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                // Fetch member DB photo
                let dbPhotoUrl = '';
                try {
                    const memberDoc = await db.collection('members').doc(data.memberId).get();
                    if (memberDoc.exists && memberDoc.data().photoUrl) {
                        dbPhotoUrl = memberDoc.data().photoUrl;
                    }
                } catch(e) { console.error("Error fetching member photo", e); }
                
                const timeStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

                const card = document.createElement('div');
                card.className = 'bg-surface-container border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-4 shadow-lg';
                card.id = `card-${doc.id}`;
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-headline-md text-lg text-primary uppercase leading-tight">${data.memberName}</h3>
                            <p class="text-xs text-on-surface-variant font-label-md">ID: ${data.memberId}</p>
                        </div>
                        <span class="text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">${timeStr}</span>
                    </div>
                    
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <p class="text-[10px] text-center text-on-surface-variant uppercase tracking-widest mb-1">DB Profile</p>
                            <div class="w-full aspect-[3/4] rounded bg-surface-container-low border border-outline-variant/50 overflow-hidden flex items-center justify-center">
                                ${dbPhotoUrl ? `<img src="${dbPhotoUrl}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined opacity-30 text-4xl">person</span>`}
                            </div>
                        </div>
                        <div class="flex-1">
                            <p class="text-[10px] text-center text-primary uppercase tracking-widest mb-1">Live Photo</p>
                            <div class="w-full aspect-[3/4] rounded border border-primary/50 overflow-hidden flex items-center justify-center">
                                <img src="${data.uploadedPhotoUrl}" class="w-full h-full object-cover transform scale-x-[-1]">
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-2 mt-2">
                        <button class="btn-reject flex-1 bg-surface-container-highest border border-outline-variant/50 text-error py-2 rounded-lg hover:bg-error-container hover:text-on-error-container transition-all flex items-center justify-center gap-1 font-medium" data-id="${doc.id}">
                            <span class="material-symbols-outlined text-sm">close</span> Reject
                        </button>
                        <button class="btn-confirm flex-1 bg-primary text-on-primary py-2 rounded-lg hover:brightness-110 glow-primary transition-all flex items-center justify-center gap-1 font-bold" data-id="${doc.id}" data-member="${data.memberId}" data-name="${data.memberName}" data-photo="${data.uploadedPhotoUrl}" data-dbphoto="${dbPhotoUrl}">
                            <span class="material-symbols-outlined text-sm">check</span> Confirm
                        </button>
                    </div>
                `;
                pendingGrid.appendChild(card);
            }
        });

    updateTodayConfirmedCount();
}

async function updateTodayConfirmedCount() {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
        const snap = await db.collection('entries')
            .where('entryType', '==', 'gamezone')
            .where('date', '==', todayStr)
            .get();
        statTodayConfirmed.textContent = snap.size;
    } catch(e) { console.error(e); }
}

pendingGrid.addEventListener('click', async (e) => {
    const confirmBtn = e.target.closest('.btn-confirm');
    const rejectBtn = e.target.closest('.btn-reject');

    if (confirmBtn) {
        const id = confirmBtn.dataset.id;
        const memberId = confirmBtn.dataset.member;
        const memberName = confirmBtn.dataset.name;
        const livePhoto = confirmBtn.dataset.photo;
        const dbPhoto = confirmBtn.dataset.dbphoto;
        const card = document.getElementById(`card-${id}`);

        // Disable buttons
        const btns = card.querySelectorAll('button');
        btns.forEach(b => b.disabled = true);
        confirmBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span>';

        try {
            const todayStr = new Date().toISOString().split('T')[0];
            await db.collection('entries').add({
                memberId: memberId,
                memberName: memberName,
                photoUrl: dbPhoto,
                livePhotoUrl: livePhoto,
                entryType: 'gamezone',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                date: todayStr,
                confirmedBy: auth.currentUser.email,
                status: 'confirmed'
            });

            await db.collection('pendingCheckins').doc(id).update({ status: 'confirmed' });
            
            card.classList.add('fade-out');
            setTimeout(() => card.remove(), 300);
            
            showToast('Entry Confirmed');
            updateTodayConfirmedCount();
        } catch (err) {
            console.error(err);
            showToast('Confirmation failed', 'error');
            btns.forEach(b => b.disabled = false);
            confirmBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Confirm';
        }
    } 
    else if (rejectBtn) {
        const id = rejectBtn.dataset.id;
        const card = document.getElementById(`card-${id}`);
        
        const btns = card.querySelectorAll('button');
        btns.forEach(b => b.disabled = true);
        rejectBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span>';

        try {
            await db.collection('pendingCheckins').doc(id).update({ status: 'rejected' });
            card.classList.add('fade-out');
            setTimeout(() => card.remove(), 300);
            showToast('Entry Rejected', 'error');
        } catch(err) {
            console.error(err);
            showToast('Rejection failed', 'error');
            btns.forEach(b => b.disabled = false);
            rejectBtn.innerHTML = '<span class="material-symbols-outlined text-sm">close</span> Reject';
        }
    }
});

// === TAB 2: REPORTS ===

document.querySelectorAll('.rep-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        loadReportsData(e.target.dataset.period);
    });
});

document.getElementById('btn-custom-filter').addEventListener('click', () => {
    loadReportsData('custom');
});

async function loadReportsData(period) {
    let fromDate, toDate;
    const today = new Date();
    
    if (period === 'today') {
        fromDate = today.toISOString().split('T')[0];
        toDate = fromDate;
    } else if (period === 'week') {
        const past = new Date(today);
        past.setDate(past.getDate() - 6);
        fromDate = past.toISOString().split('T')[0];
        toDate = today.toISOString().split('T')[0];
    } else if (period === 'month') {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (period === 'custom') {
        fromDate = document.getElementById('rep-from').value;
        toDate = document.getElementById('rep-to').value;
        if (!fromDate || !toDate) {
            showToast('Please select both dates', 'error');
            return;
        }
    }

    // Set inputs to show current range
    document.getElementById('rep-from').value = fromDate;
    document.getElementById('rep-to').value = toDate;

    try {
        const snap = await db.collection('entries')
            .where('date', '>=', fromDate)
            .where('date', '<=', toDate)
            .get();

        let allEntries = [];
        snap.forEach(doc => {
            const data = doc.data();
            if (data.entryType === 'gamezone') {
                allEntries.push({ id: doc.id, ...data });
            }
        });
        
        // Sort descending by timestamp
        allEntries.sort((a, b) => {
            const tA = a.timestamp ? a.timestamp.toMillis() : 0;
            const tB = b.timestamp ? b.timestamp.toMillis() : 0;
            return tB - tA;
        });

        currentReportsData = [];
        let dailyCounts = {};
        let uniqueMembers = new Set();
        const tbody = document.getElementById('reports-table-body');
        tbody.innerHTML = '';

        if (allEntries.length === 0) {
            document.getElementById('rep-total-entries').textContent = '0';
            document.getElementById('rep-unique-members').textContent = '0';
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-on-surface-variant">No data for selected period</td></tr>';
            renderChart(fromDate, toDate, {});
            return;
        }

        allEntries.forEach(data => {
            const timeStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--';
            
            currentReportsData.push({ ...data, timeStr });
            
            dailyCounts[data.date] = (dailyCounts[data.date] || 0) + 1;
            uniqueMembers.add(data.memberId);

            tbody.innerHTML += `
                <tr id="row-${data.id}">
                    <td>${data.date}</td>
                    <td>${timeStr}</td>
                    <td class="font-bold text-on-surface">${data.memberName}</td>
                    <td>${data.memberId}</td>
                    <td>
                        <button class="text-error hover:text-error-container transition-colors delete-entry-btn" data-id="${data.id}" title="Remove Entry">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('rep-total-entries').textContent = allEntries.length;
        document.getElementById('rep-unique-members').textContent = uniqueMembers.size;
        
        renderChart(fromDate, toDate, dailyCounts);

        // Bind delete buttons
        document.querySelectorAll('.delete-entry-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this entry?')) {
                    const id = e.currentTarget.dataset.id;
                    try {
                        await db.collection('entries').doc(id).delete();
                        document.getElementById(`row-${id}`).remove();
                        showToast('Entry deleted');
                        loadReportsData('custom'); // reload to update stats
                    } catch(err) {
                        showToast('Delete failed', 'error');
                    }
                }
            });
        });

    } catch(err) {
        console.error(err);
        showToast('Failed to load reports', 'error');
    }
}

function renderChart(from, to, countsDict) {
    const labels = [];
    const dataPts = [];
    
    let curr = new Date(from);
    const end = new Date(to);
    
    // Safety break for huge ranges
    let days = 0;
    while(curr <= end && days < 60) {
        const ds = curr.toISOString().split('T')[0];
        labels.push(ds.substring(5)); // e.g. "05-22"
        dataPts.push(countsDict[ds] || 0);
        curr.setDate(curr.getDate() + 1);
        days++;
    }

    const ctx = document.getElementById('reportsChart').getContext('2d');
    if (reportsChart) reportsChart.destroy();
    
    Chart.defaults.color = '#d7c1c3';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    reportsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Game Zone Entries',
                data: dataPts,
                backgroundColor: '#ffb2bc',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 178, 188, 0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// === EXPORT ===
document.getElementById('btn-export-csv').addEventListener('click', async () => {
    if (currentReportsData.length === 0) return showToast('No data to export', 'error');
    
    let csvContent = "Date,Time,Member Name,Member ID\n";
    currentReportsData.forEach(row => {
        csvContent += `${row.date},${row.timeStr},"${row.memberName}",${row.memberId}\n`;
    });
    
    const fileName = `GameZone_Entries_${Date.now()}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    if (navigator.canShare) {
        try {
            const file = new File([blob], fileName, { type: 'text/csv' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: fileName,
                    files: [file]
                });
                return;
            }
        } catch (err) {
            console.log('Share failed:', err);
        }
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    if (currentReportsData.length === 0) return showToast('No data to export', 'error');
    if (typeof window.jspdf === 'undefined') return showToast('PDF library loading', 'error');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Game Zone Entries REPORT", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    const rows = currentReportsData.map(e => [e.date, e.timeStr, e.memberName, e.memberId]);
    
    doc.autoTable({
        startY: 38,
        head: [['Date', 'Time', 'Member Name', 'Member ID']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [255, 178, 188], textColor: [85, 30, 41] },
        styles: { fontSize: 10 }
    });
    
    const fileName = `GameZone_Entries_${Date.now()}.pdf`;
    
    if (navigator.canShare) {
        try {
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: fileName,
                    files: [file]
                });
                return;
            }
        } catch (err) {
            console.log('Share failed:', err);
        }
    }
    
    doc.save(fileName);
});
