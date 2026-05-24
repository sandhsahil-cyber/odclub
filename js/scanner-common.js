// Common scanner utilities for dreamclubapp

async function loginOrSignup(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return userCredential.user;
      } catch (signupError) {
        throw new Error('Failed to create account. Please check your credentials.');
      }
    }
    
    if (error.code === 'auth/invalid-credential' || error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
        throw new Error('Invalid email or password.');
    }
    
    let msg = error.message;
    if (msg.startsWith('{')) {
        try {
            const parsed = JSON.parse(msg);
            if (parsed.error && parsed.error.message) {
                msg = parsed.error.message.replace(/_/g, ' ').toLowerCase();
                msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            }
        } catch(e) {}
    }
    throw new Error(msg);
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
