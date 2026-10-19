import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from '../firebase';
import { UserProfile, UserRole } from '../types';

export const OWNER_EMAIL = 'chravindraravi49@gmail.com';

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  customer: {
    id: 'demo-student-rahul',
    email: 'student.rahul@hostel.edu',
    displayName: 'Rahul Sharma (Student)',
    role: 'customer',
    phone: '+91 98765 43210',
    hostelBlock: 'Block-B (Boys Hostel)',
    roomNumber: 'Room 314',
    isApproved: true,
  },
  admin: {
    id: 'demo-shop-owner',
    email: OWNER_EMAIL,
    displayName: 'Ravindra (Shop Owner)',
    role: 'admin',
    phone: '+91 99887 76655',
    hostelBlock: 'Main Campus Shop',
    roomNumber: 'Shop #1',
    isApproved: true,
  },
  delivery: {
    id: 'demo-delivery-amit',
    email: 'delivery.amit@ravindrapro.com',
    displayName: 'Amit Kumar (Delivery Agent)',
    role: 'delivery',
    phone: '+91 91234 56789',
    hostelBlock: 'Hostel Ground Floor Hub',
    roomNumber: 'Dispatch Counter',
    isApproved: true,
  },
};

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerStudent: (
    email: string,
    pass: string,
    name: string,
    phone: string,
    hostelBlock: string,
    roomNumber: string
  ) => Promise<UserProfile>;
  registerDeliveryStaff: (
    email: string,
    pass: string,
    name: string,
    phone: string
  ) => Promise<{ success: boolean; message: string }>;
  loginDemo: (role: UserRole) => Promise<UserProfile>;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  updateProfileDetails: (data: Partial<UserProfile>) => Promise<void>;
  isOwnerAdmin: boolean;
  isDeliveryStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check saved session in localStorage
    const saved = localStorage.getItem('rp_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Strict requirement: User must log in first, do not default to logged in
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (fbUser.email === OWNER_EMAIL && data.role !== 'admin') {
              data.role = 'admin';
              await updateDoc(userDocRef, { role: 'admin' });
            }
            setUser(data);
            localStorage.setItem('rp_current_user', JSON.stringify(data));
          } else {
            const isOwner = fbUser.email === OWNER_EMAIL;
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Hostel Student',
              role: isOwner ? 'admin' : 'customer',
              phone: fbUser.phoneNumber || '',
              hostelBlock: 'Block-A (Boys Hostel)',
              roomNumber: 'Room 101',
              isApproved: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, sanitizeForFirestore(newProfile));
            setUser(newProfile);
            localStorage.setItem('rp_current_user', JSON.stringify(newProfile));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<UserProfile> => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);

      let profile: UserProfile;
      if (docSnap.exists()) {
        profile = docSnap.data() as UserProfile;
        if (fbUser.email === OWNER_EMAIL && profile.role !== 'admin') {
          profile.role = 'admin';
          await updateDoc(userDocRef, { role: 'admin' });
        }
      } else {
        const isOwner = fbUser.email === OWNER_EMAIL;
        profile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Hostel Student',
          role: isOwner ? 'admin' : 'customer',
          phone: fbUser.phoneNumber || '',
          hostelBlock: 'Block-B (Boys Hostel)',
          roomNumber: 'Room 314',
          isApproved: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, sanitizeForFirestore(profile));
      }

      setUser(profile);
      localStorage.setItem('rp_current_user', JSON.stringify(profile));
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = res.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const isOwner = fbUser.email === OWNER_EMAIL;
        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || email,
          displayName: email.split('@')[0],
          role: isOwner ? 'admin' : 'customer',
          phone: '',
          hostelBlock: 'Block-A (Boys Hostel)',
          roomNumber: 'Room 101',
          isApproved: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, sanitizeForFirestore(newProfile));
        setUser(newProfile);
        localStorage.setItem('rp_current_user', JSON.stringify(newProfile));
        return newProfile;
      }

      const profile = docSnap.data() as UserProfile;

      // Delivery staff must be approved by shop owner
      if (profile.role === 'delivery' && !profile.isApproved) {
        await fbSignOut(auth);
        throw new Error('Your delivery staff account is pending approval by the Shop Owner.');
      }

      setUser(profile);
      localStorage.setItem('rp_current_user', JSON.stringify(profile));
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (
    email: string,
    pass: string,
    name: string,
    phone: string,
    hostelBlock: string,
    roomNumber: string
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = res.user;

      // New student is always customer
      const isOwner = email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
      const newProfile: UserProfile = {
        id: fbUser.uid,
        email: email.trim(),
        displayName: name.trim() || 'Hostel Student',
        role: isOwner ? 'admin' : 'customer',
        phone: phone.trim(),
        hostelBlock,
        roomNumber: roomNumber.trim(),
        isApproved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), sanitizeForFirestore(newProfile));
      setUser(newProfile);
      localStorage.setItem('rp_current_user', JSON.stringify(newProfile));
      return newProfile;
    } finally {
      setLoading(false);
    }
  };

  const registerDeliveryStaff = async (
    email: string,
    pass: string,
    name: string,
    phone: string
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = res.user;

      const newProfile: UserProfile = {
        id: fbUser.uid,
        email: email.trim(),
        displayName: name.trim() || 'Delivery Staff',
        role: 'delivery',
        phone: phone.trim(),
        hostelBlock: 'Ground Floor Dispatch',
        roomNumber: 'Station 1',
        isApproved: false, // Requires Shop Owner approval!
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), sanitizeForFirestore(newProfile));
      // Sign out immediately until owner approves
      await fbSignOut(auth);
      return {
        success: true,
        message: 'Delivery staff registration submitted! The Shop Owner must approve your account before you can log in.',
      };
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role: UserRole): Promise<UserProfile> => {
    const demo = { ...DEMO_USERS[role] };
    setUser(demo);
    localStorage.setItem('rp_current_user', JSON.stringify(demo));
    return demo;
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.warn('Firebase signOut note:', e);
    } finally {
      localStorage.removeItem('rp_current_user');
      setUser(null);
    }
  };

  const updateProfileDetails = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem('rp_current_user', JSON.stringify(updated));

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', user.id), sanitizeForFirestore(data));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const switchRole = (role: UserRole) => {
    loginDemo(role);
  };

  const isOwnerAdmin = user?.role === 'admin';
  const isDeliveryStaff = user?.role === 'delivery';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerStudent,
        registerDeliveryStaff,
        loginDemo,
        switchRole,
        logout,
        updateProfileDetails,
        isOwnerAdmin,
        isDeliveryStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
