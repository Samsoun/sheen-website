import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, getCustomerByUID } from '../firebase-config';
import { User, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  customerData: any | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  customerData: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const data = await getCustomerByUID(currentUser.uid);
          setCustomerData(data);
        } catch (error) {
          console.error('Fehler beim Abrufen der Kundendaten:', error);
        }
      } else {
        setCustomerData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, customerData }}>{children}</AuthContext.Provider>
  );
};
