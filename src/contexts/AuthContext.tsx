import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/services/firebase";

export type ChatUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  online?: boolean;
  lastSeen?: number;
};

type AuthContextValue = {
  user: User | null;
  profile: ChatUser | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserDoc(u: User, displayNameOverride?: string) {
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  const displayName =
    displayNameOverride || u.displayName || (u.email ? u.email.split("@")[0] : "User");
  const photoURL =
    u.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.uid)}`;

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      displayName,
      email: u.email || "",
      photoURL,
      online: true,
      lastSeen: Date.now(),
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { online: true, lastSeen: Date.now(), photoURL });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await ensureUserDoc(u);
        const snap = await getDoc(doc(db, "users", u.uid));
        setProfile(snap.data() as ChatUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const setOffline = () => {
      try {
        updateDoc(doc(db, "users", user.uid), {
          online: false,
          lastSeen: Date.now(),
        });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("beforeunload", setOffline);
    const interval = setInterval(() => {
      updateDoc(doc(db, "users", user.uid), {
        online: true,
        lastSeen: Date.now(),
      }).catch(() => {});
    }, 30000);
    return () => {
      window.removeEventListener("beforeunload", setOffline);
      clearInterval(interval);
      setOffline();
    };
  }, [user]);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signInEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signUpEmail: async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, {
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cred.user.uid)}`,
      });
      await ensureUserDoc(cred.user, name);
    },
    signInGoogle: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    logout: async () => {
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          online: false,
          lastSeen: Date.now(),
        }).catch(() => {});
      }
      await signOut(auth);
    },
    updateUserProfile: async (data) => {
      if (!user) throw new Error("Not authenticated");
      // Update Firebase Auth profile
      const authUpdate: { displayName?: string; photoURL?: string } = {};
      if (data.displayName) authUpdate.displayName = data.displayName;
      
      // Firebase auth photoURL has length limits, skip data URLs
      if (data.photoURL && !data.photoURL.startsWith("data:")) {
        authUpdate.photoURL = data.photoURL;
      }

      if (Object.keys(authUpdate).length > 0) {
        await updateProfile(user, authUpdate);
      }
      // Update Firestore user doc
      const firestoreUpdate: Record<string, unknown> = {};
      if (data.displayName) firestoreUpdate.displayName = data.displayName;
      if (data.photoURL) firestoreUpdate.photoURL = data.photoURL;
      if (Object.keys(firestoreUpdate).length > 0) {
        await updateDoc(doc(db, "users", user.uid), firestoreUpdate);
      }
      // Refresh local profile
      const snap = await getDoc(doc(db, "users", user.uid));
      setProfile(snap.data() as ChatUser);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
