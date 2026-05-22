// DOM Elements
const sectionLoading = document.getElementById('section-loading');
const sectionMain = document.getElementById('section-main');
const sectionSuccess = document.getElementById('section-success');
const sectionError = document.getElementById('section-error');
const errorMessage = document.getElementById('error-message');

const memberNameDisplay = document.getElementById('member-name-display');
const entryBadge = document.getElementById('entry-badge');

const btnCamera = document.getElementById('btn-camera');
const cameraInput = document.getElementById('camera-input');
const cameraInputRetake = document.getElementById('camera-input-retake');
const photoPreview = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');
const actionButtons = document.getElementById('action-buttons');
const btnSubmit = document.getElementById('btn-submit');

// Global state
let currentToken = null;
let currentData = null;
let selectedFile = null;

function showError(msg) {
    sectionLoading.classList.add('hidden');
    sectionMain.classList.add('hidden');
    sectionSuccess.classList.add('hidden');
    
    errorMessage.textContent = msg;
    sectionError.classList.remove('hidden');
}

// ON PAGE LOAD
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentToken = urlParams.get('token');

    if (!currentToken) {
        showError('Invalid link');
        return;
    }

    try {
        const docRef = db.collection('pendingCheckins').doc(currentToken);
        const doc = await docRef.get();

        if (!doc.exists) {
            showError('Invalid or expired QR code');
            return;
        }

        currentData = doc.data();

        // Check expiry
        const now = new Date();
        const expiresAt = currentData.expiresAt ? currentData.expiresAt.toDate() : new Date(0);
        
        if (now > expiresAt) {
            showError('QR Code has expired');
            return;
        }

        // Check status
        if (currentData.status !== 'active') {
            showError('This QR code has already been used');
            return;
        }

        // Valid, show main section
        memberNameDisplay.textContent = `Welcome, ${currentData.memberName}`;
        entryBadge.textContent = currentData.entryType === 'gym' ? 'GYM' : 'GAME ZONE';

        sectionLoading.classList.add('hidden');
        sectionMain.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        showError('Network error. Please try again.');
    }
});

// CAMERA FUNCTION
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.src = e.target.result;
            photoPreview.classList.remove('hidden');
            photoPlaceholder.classList.add('hidden');
            
            btnCamera.classList.add('hidden');
            actionButtons.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

cameraInput.addEventListener('change', handleFileSelect);
cameraInputRetake.addEventListener('change', handleFileSelect);

// SUBMIT FUNCTION
btnSubmit.addEventListener('click', async () => {
    if (!selectedFile || !currentToken || !currentData) return;
    
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="material-symbols-outlined animate-spin mr-2">sync</span> Uploading...';

    try {
        const timestamp = Date.now();
        const memberId = currentData.memberId;
        const entryType = currentData.entryType;
        const filePath = `uploads/${entryType}/${memberId}_${timestamp}.jpg`;
        
        const storageRef = storage.ref(filePath);
        
        // Upload file
        const snapshot = await storageRef.put(selectedFile);
        const downloadURL = await snapshot.ref.getDownloadURL();

        // Update Firestore
        await db.collection('pendingCheckins').doc(currentToken).update({
            uploadedPhotoUrl: downloadURL,
            status: 'photo_uploaded'
        });

        // Show Success
        sectionMain.classList.add('hidden');
        sectionSuccess.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Submit Photo';
        alert('Failed to upload photo. Please check your connection and try again.');
    }
});
