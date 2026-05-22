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
