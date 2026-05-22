// Helper: Get data from localStorage
function getLocalData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Helper: Save data to localStorage
function saveLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

document.addEventListener('DOMContentLoaded', () => {
    const memberForm = document.getElementById('member-form');
    const otpForm = document.getElementById('otp-form');
    const step1 = document.getElementById('step-1-member-id');
    const step2 = document.getElementById('step-2-otp');
    const step3 = document.getElementById('step-3-status');
    const alertContainer = document.getElementById('alert-container');
    const phoneEndingSpan = document.getElementById('phone-ending');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');

    let currentMember = null;

    function showAlert(message, type) {
        alertContainer.className = `alert alert-${type}`;
        alertContainer.textContent = message;
        alertContainer.classList.remove('hidden');
    }

    function hideAlert() {
        alertContainer.classList.add('hidden');
    }

    function showStatus(title, message, isSuccess) {
        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.remove('hidden');
        
        statusTitle.textContent = title;
        statusTitle.style.color = isSuccess ? 'var(--success-color)' : 'var(--error-color)';
        statusMessage.textContent = message;
    }

    memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideAlert();
        
        const memberId = document.getElementById('memberId').value.trim();
        const btn = document.getElementById('send-otp-btn');
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        // 1. Check if member exists in localStorage
        const members = getLocalData('gym_members');
        currentMember = members.find(m => m.id === memberId);
        
        if (!currentMember) {
            showAlert('Member ID not found. Please check and try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Send OTP';
            return;
        }

        // 2. Check if already checked in today
        const today = new Date().toISOString().split('T')[0];
        const checkins = getLocalData('gym_checkins');
        const alreadyCheckedIn = checkins.some(c => c.memberId === currentMember.id && c.date === today);

        if (alreadyCheckedIn) {
            showStatus('Already Checked In', `You have already checked in today, ${currentMember.name}. Have a great workout!`, false);
            return;
        }

        // 3. Simulate OTP sending
        const phoneNumber = currentMember.phone || '+10000000000';
        
        btn.textContent = 'Sending OTP...';
        
        setTimeout(() => {
            phoneEndingSpan.textContent = phoneNumber.slice(-4);
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        }, 800); // Fake delay for demo
    });

    otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideAlert();
        
        const btn = document.getElementById('verify-otp-btn');
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        setTimeout(() => {
            // 1. Record Check-in in localStorage
            const today = new Date().toISOString().split('T')[0];
            const checkins = getLocalData('gym_checkins');
            
            checkins.push({
                memberId: currentMember.id,
                memberName: currentMember.name,
                date: today,
                timestamp: new Date().toISOString()
            });
            
            saveLocalData('gym_checkins', checkins);

            // 2. Show Success Screen
            showStatus('Check-in Successful', `Welcome, ${currentMember.name}! You are checked in for today.`, true);
        }, 800); // Fake delay for demo
    });
});
