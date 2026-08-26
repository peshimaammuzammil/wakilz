import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { type User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export type UserRole = 'admin' | 'client'

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  clientId?: string
  displayName?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            setProfile({ uid: firebaseUser.uid, email: firebaseUser.email!, ...docSnap.data() } as UserProfile)
          } else {
            // Default profile for authenticated users without an explicit Firestore document
            const defaultRole: UserRole = firebaseUser.email?.toLowerCase().includes('admin') ? 'admin' : 'client'
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: defaultRole,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Client',
              clientId: 'wakilz_demo',
            })
          }
        } catch {
          // Graceful fallback on network/permission restrictions
          const defaultRole: UserRole = firebaseUser.email?.toLowerCase().includes('admin') ? 'admin' : 'client'
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: defaultRole,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Client',
            clientId: 'wakilz_demo',
          })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logOut = async () => {
    await signOut(auth)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
