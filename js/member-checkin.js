// Global variables
let selectedZone = null;
let currentToken = null;
let pollingInterval = null;
let countdownInterval = null;

// DOM Elements
const sectionButtons = document.getElementById('section-buttons');
const sectionInput = document.getElementById('section-input');
const sectionQr = document.getElementById('section-qr');
const sectionSuccess = document.getElementById('section-success');
const sectionRejected = document.getElementById('section-rejected');

const zoneTitle = document.getElementById('zone-title');
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

// FUNCTION 1
function selectZone(zone) {
    selectedZone = zone;
    sectionButtons.classList.add('hidden');
    sectionInput.classList.remove('hidden');
    zoneTitle.textContent = zone === 'gym' ? 'GYM CHECK-IN' : 'GAME ZONE CHECK-IN';
    hideError();
}

// FUNCTION 2
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
        // memberPhotoUrl is saved if needed, but primarily we need name for display

        // Step 2: Check settings timing
        const settingsDoc = await db.collection('settings').doc('gymTiming').get();
        if (settingsDoc.exists) {
            const timings = settingsDoc.data();
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHour}:${currentMinute}`;
            
            let openTime = selectedZone === 'gym' ? timings.gymOpen : timings.gamezoneOpen;
            let closeTime = selectedZone === 'gym' ? timings.gymClose : timings.gamezoneClose;

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
            .where('entryType', '==', selectedZone)
            .get();
        
        if (!entriesSnapshot.empty) {
            throw new Error('You have already checked in today!');
        }

        // Step 4: Check if pending checkin already exists
        const pendingSnapshot = await db.collection('pendingCheckins')
            .where('memberId', '==', memberId)
            .where('entryType', '==', selectedZone)
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
            entryType: selectedZone,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiresAt: firebase.firestore.Timestamp.fromDate(expiresAtDate),
            uploadedPhotoUrl: ''
        });
        
        currentToken = docRef.id;

        // Step 6: Generate QR code
        const URL = window.location.href.split('/member-checkin.html')[0] + "/photo-upload.html?token=" + currentToken;
        QRCode.toCanvas(qrCanvas, URL, { width: 250, margin: 2, color: { dark: '#131313', light: '#ffffff' } }, function (error) {
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

// FUNCTION 3
function startCountdown(seconds) {
    let timeLeft = seconds;
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
            if (pollingInterval) clearInterval(pollingInterval);
            
            // update status to expired
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

// FUNCTION 4
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
                    
                    setTimeout(resetPage, 3000);
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

// FUNCTION 5
function resetPage() {
    if (pollingInterval) clearInterval(pollingInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    
    selectedZone = null;
    currentToken = null;
    
    hideError();
    memberIdInput.value = '';
    
    sectionButtons.classList.remove('hidden');
    sectionInput.classList.add('hidden');
    sectionQr.classList.add('hidden');
    sectionSuccess.classList.add('hidden');
    sectionRejected.classList.add('hidden');
}
