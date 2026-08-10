import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAieaNn9LzmBQ8yulaqmW5K3mXkHseJ7g8",
  authDomain: "wakilz-dasboard.firebaseapp.com",
  projectId: "wakilz-dasboard",
  storageBucket: "wakilz-dasboard.firebasestorage.app",
  messagingSenderId: "635406175951",
  appId: "1:635406175951:web:4788187db3b0e7cf3e31ba",
  measurementId: "G-WLCR18VWMZ"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
