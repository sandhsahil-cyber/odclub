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
