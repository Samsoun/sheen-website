import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  AuthProvider,
  UserCredential,
  deleteUser,
  confirmPasswordReset as firebaseConfirmPasswordReset,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase Konfiguration - Direkt eingebettet für Stabilität
const firebaseConfig = {
  apiKey: "AIzaSyB7tnzEzeRBqQ1JL8aNgRe2PPuOS0Mt5Ms",
  authDomain: "sheen-termin.firebaseapp.com",
  projectId: "sheen-termin",
  storageBucket: "sheen-termin.firebasestorage.app",
  messagingSenderId: "531525100411",
  appId: "1:531525100411:web:59b8c142e3deca949613de",
  measurementId: "G-F69XYP1FV5",
};

// Firebase App initialisieren
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics (nur im Browser und wenn unterstützt)
export const analytics =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : null;

// Schnittstelle für Benutzerdaten
export interface CustomerData {
  uid?: string;
  firstName: string;
  lastName: string;
  phone?: string; // Optional, da es null sein kann
  email: string;
  birthdate: string; // Format: YYYY-MM-DD
  profileImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Benutzer registrieren und Kundendaten speichern
 */
export async function registerCustomer(
  email: string,
  password: string,
  customerData: CustomerData
): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    // Benutzer mit E-Mail und Passwort erstellen
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Wenn Profilbild vorhanden, hochladen und URL abrufen
    let profileImageUrl = customerData.profileImageUrl;

    // Benutzernamen (Vorname + Nachname) im Auth-Profil setzen
    await updateProfile(user, {
      displayName: `${customerData.firstName} ${customerData.lastName}`,
      photoURL: profileImageUrl || null,
    });

    // Vollständige Kundendaten in Firestore speichern
    await addDoc(collection(db, "customers"), {
      uid: user.uid,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone,
      email: customerData.email,
      birthdate: customerData.birthdate,
      profileImageUrl: profileImageUrl || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      uid: user.uid,
    };
  } catch (error) {
    console.error("Fehler bei der Kundenregistrierung:", error);

    // Spezifische Fehlermeldungen für bekannte Firebase-Fehler
    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes("auth/email-already-in-use")) {
        return {
          success: false,
          error: "auth/email-already-in-use",
        };
      }

      if (errorMessage.includes("auth/weak-password")) {
        return {
          success: false,
          error:
            "Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort.",
        };
      }

      if (errorMessage.includes("auth/invalid-email")) {
        return {
          success: false,
          error:
            "Die E-Mail-Adresse ist ungültig. Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error: "Unbekannter Fehler bei der Registrierung",
    };
  }
}

/**
 * Benutzer anmelden
 */
export async function loginCustomer(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Fehler bei der Anmeldung:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Benutzer abmelden
 */
export async function logoutCustomer(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await signOut(auth);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Passwort zurücksetzen
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const actionCodeSettings = {
      url: `${window.location.origin}/login`, // Nach dem Zurücksetzen zur Login-Seite weiterleiten
      handleCodeInApp: false,
    };

    console.log("Reset-Link wird gesendet an:", email);
    console.log("Mit Weiterleitung zu:", actionCodeSettings.url);

    await sendPasswordResetEmail(auth, email, actionCodeSettings);

    console.log("Reset-Link erfolgreich gesendet");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Fehler beim Senden des Reset-Links:", error);

    // Spezifische Fehlerbehandlung
    if (error instanceof Error) {
      const errorMessage = error.message || "";

      // Spezifische Firebase-Fehlermeldungen übersetzen
      if (errorMessage.includes("auth/user-not-found")) {
        return {
          success: false,
          error: "Es wurde kein Konto mit dieser E-Mail-Adresse gefunden.",
        };
      }

      if (errorMessage.includes("auth/invalid-email")) {
        return {
          success: false,
          error: "Die eingegebene E-Mail-Adresse ist ungültig.",
        };
      }

      if (errorMessage.includes("auth/too-many-requests")) {
        return {
          success: false,
          error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error:
        "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    };
  }
}

/**
 * Passwort mit Verifikations-Code zurücksetzen
 * Diese Funktion wird verwendet, wenn der Benutzer den Link in der Reset-E-Mail anklickt
 */
export async function confirmPasswordReset(
  oobCode: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Zusätzliche Validierung
    if (!oobCode || oobCode.trim() === "") {
      console.error("Leerer oobCode bei confirmPasswordReset");
      return {
        success: false,
        error:
          "Der Reset-Code fehlt oder ist ungültig. Bitte fordern Sie einen neuen Reset-Link an.",
      };
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      };
    }

    // Versuch, das Passwort zurückzusetzen
    await firebaseConfirmPasswordReset(auth, oobCode, newPassword);

    console.log("Passwort erfolgreich zurückgesetzt");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);

    // Spezifische Fehlerbehandlung
    if (error instanceof Error) {
      const errorMessage = error.message || "";

      // Spezifische Firebase-Fehlermeldungen übersetzen
      if (
        errorMessage.includes("auth/invalid-action-code") ||
        errorMessage.includes("auth/expired-action-code")
      ) {
        return {
          success: false,
          error:
            "Der Reset-Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.",
        };
      }

      if (errorMessage.includes("auth/weak-password")) {
        return {
          success: false,
          error:
            "Das gewählte Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort mit mindestens 8 Zeichen.",
        };
      }

      if (errorMessage.includes("auth/user-not-found")) {
        return {
          success: false,
          error:
            "Der Benutzer wurde nicht gefunden. Möglicherweise wurde das Konto gelöscht.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error:
        "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    };
  }
}

/**
 * Benutzerdaten anhand von UID abrufen
 */
export async function getCustomerByUID(
  uid: string
): Promise<CustomerData | null> {
  try {
    const q = query(collection(db, "customers"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const customerDoc = snapshot.docs[0];
    const customerData = customerDoc.data() as CustomerData;

    return {
      ...customerData,
      uid: customerDoc.id,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Kundendaten:", error);
    return null;
  }
}

/**
 * Benutzerdaten aktualisieren
 */
export async function updateCustomerData(
  uid: string,
  customerData: Partial<CustomerData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Finde den Kundendokument mit der UID
    const q = query(collection(db, "customers"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error("Kunde nicht gefunden für UID:", uid);
      return {
        success: false,
        error: "Kunde nicht gefunden",
      };
    }

    const customerDoc = snapshot.docs[0];
    const currentData = customerDoc.data();

    console.log("Aktualisiere Kundendaten:", {
      docId: customerDoc.id,
      currentData,
      newData: customerData,
    });

    // Daten aktualisieren, aber uid beibehalten
    const updateData = {
      ...customerData,
      uid: currentData.uid, // Stelle sicher, dass die uid nicht überschrieben wird
      updatedAt: Timestamp.now(),
    };

    // Aktualisiere das Dokument
    await updateDoc(doc(db, "customers", customerDoc.id), updateData);

    // Wenn der Name aktualisiert wurde, aktualisiere auch das Auth-Profil
    if (customerData.firstName || customerData.lastName) {
      const user = auth.currentUser;
      if (user) {
        const firstName = customerData.firstName || currentData.firstName;
        const lastName = customerData.lastName || currentData.lastName;

        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
        });
      }
    }

    // Wenn das Profilbild aktualisiert wurde, aktualisiere auch das Auth-Profil
    if (customerData.profileImageUrl !== undefined) {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          photoURL: customerData.profileImageUrl || null,
        });
      }
    }

    console.log("Kundendaten erfolgreich aktualisiert");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Kundendaten:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Profilbild hochladen und URL zurückgeben
 */
export async function uploadProfileImage(
  uid: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Speicherpfad für das Profilbild
    const storageRef = ref(storage, `profileImages/${uid}/${file.name}`);

    // Bild hochladen
    await uploadBytes(storageRef, file);

    // Download-URL abrufen
    const downloadURL = await getDownloadURL(storageRef);

    // URL in Kundendaten speichern
    await updateCustomerData(uid, { profileImageUrl: downloadURL });

    return {
      success: true,
      url: downloadURL,
    };
  } catch (error) {
    console.error("Fehler beim Hochladen des Profilbilds:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Profilbild löschen
 */
export async function deleteProfileImage(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Aktuellen Benutzer abrufen
    const q = query(collection(db, "customers"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        error: "Kunde nicht gefunden",
      };
    }

    const customerDoc = snapshot.docs[0];
    const customerData = customerDoc.data() as CustomerData;

    // Wenn ein Profilbild vorhanden ist
    if (customerData.profileImageUrl) {
      try {
        // Storage-Referenz aus der URL extrahieren
        const url = new URL(customerData.profileImageUrl);
        const path = url.pathname.split("/o/")[1];

        if (path) {
          const decodedPath = decodeURIComponent(path.split("?")[0]);
          const imageRef = ref(storage, decodedPath);

          // Bild aus dem Storage löschen
          await deleteObject(imageRef);
        }
      } catch (storageError) {
        console.warn(
          "Fehler beim Löschen des Bildes aus dem Storage:",
          storageError
        );
        // Fehler beim Löschen des Bildes aus dem Storage blockiert nicht den gesamten Prozess
      }
    }

    // Profilbild-URL aus den Kundendaten entfernen
    await updateDoc(doc(db, "customers", customerDoc.id), {
      profileImageUrl: null,
      updatedAt: Timestamp.now(),
    });

    // Auth-Profil aktualisieren
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, {
        photoURL: null,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Fehler beim Löschen des Profilbilds:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Kundeninformationen abrufen (ohne Passwort)
 */
export async function getCustomerById(customerId: string): Promise<any> {
  try {
    const customerRef = doc(db, "customers", customerId);
    const docSnap = await getDoc(customerRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
      };
    } else {
      console.log("Keine Kundendaten gefunden für ID:", customerId);
      return null;
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Kundendaten:", error);
    return null;
  }
}

/**
 * Löscht einen Kunden und seine assoziierten Daten
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
  try {
    // Kundendokument abrufen
    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists()) {
      console.error("Kunde nicht gefunden:", customerId);
      return false;
    }

    // UID des Firebase-Auth-Benutzers abrufen
    const customerData = customerSnap.data();
    const authUserId = customerData.uid;

    // Kunden aus Firestore löschen
    await deleteDoc(customerRef);
    console.log("Kundendokument gelöscht:", customerId);

    // Firebase Auth-Benutzer löschen, wenn möglich
    if (authUserId) {
      try {
        // Hier würde normalerweise eine Admin-SDK-Funktion stehen
        // Da wir das im Frontend nicht direkt machen können, müssten wir
        // einen Cloud Function-Aufruf oder API-Request implementieren
        console.log(
          "Auth-Benutzer kann nur über Admin-SDK oder Cloud Functions gelöscht werden"
        );
      } catch (authError) {
        console.error("Fehler beim Löschen des Auth-Benutzers:", authError);
      }
    }

    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Kunden:", error);
    return false;
  }
}

/**
 * Holt alle Kunden
 */
export async function getAllCustomers(): Promise<any[]> {
  try {
    const customersRef = collection(db, "customers");
    const snapshot = await getDocs(customersRef);

    if (snapshot.empty) {
      console.log("Keine Kunden gefunden");
      return [];
    }

    const customers: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        ...data,
        id: doc.id,
      });
    });

    return customers;
  } catch (error) {
    console.error("Fehler beim Abrufen aller Kunden:", error);
    return [];
  }
}

/**
 * Mit Google anmelden
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Überprüfen, ob der Benutzer bereits in unserer Datenbank existiert
    const customerData = await getCustomerByUID(user.uid);

    if (!customerData) {
      // Benutzer existiert noch nicht in der Datenbank, speichere grundlegende Infos
      const [firstName, ...lastNameParts] = user.displayName?.split(" ") || [
        "Kunde",
        "",
      ];
      const lastName = lastNameParts.join(" ") || "";

      await addDoc(collection(db, "customers"), {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: user.email || "",
        phone: user.phoneNumber || "",
        profileImageUrl: user.photoURL || null,
        birthdate: "", // Muss später vom Benutzer ausgefüllt werden
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Fehler bei der Google-Anmeldung:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Mit Social Media-Anbieter anmelden (generische Funktion)
 */
export async function signInWithProvider(providerId: "google.com"): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    let provider: AuthProvider;

    if (providerId === "google.com") {
      provider = new GoogleAuthProvider();
      (provider as GoogleAuthProvider).addScope("profile");
      (provider as GoogleAuthProvider).addScope("email");
    } else {
      throw new Error("Nicht unterstützter Anbieter");
    }

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Überprüfen, ob der Benutzer bereits in unserer Datenbank existiert
    const customerData = await getCustomerByUID(user.uid);

    if (!customerData) {
      // Benutzer existiert noch nicht in der Datenbank, speichere grundlegende Infos
      const [firstName, ...lastNameParts] = user.displayName?.split(" ") || [
        "Kunde",
        "",
      ];
      const lastName = lastNameParts.join(" ") || "";

      await addDoc(collection(db, "customers"), {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: user.email || "",
        phone: user.phoneNumber || "",
        profileImageUrl: user.photoURL || null,
        birthdate: "", // Muss später vom Benutzer ausgefüllt werden
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error(`Fehler bei der Anmeldung mit ${providerId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Benutzerkonto und zugehörige Daten löschen
 */
export async function deleteCustomerAccount(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Zuerst Profilbild löschen, wenn vorhanden
    await deleteProfileImage(uid);

    // Kundendokument aus Firestore löschen
    const q = query(collection(db, "customers"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const customerDoc = snapshot.docs[0];
      await deleteDoc(doc(db, "customers", customerDoc.id));
    }

    // Auth-Benutzer löschen
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    } else {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Fehler beim Löschen des Benutzerkontos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/*
ANLEITUNG ZUR EINRICHTUNG VON FIREBASE:

1. Erstellen Sie ein Firebase-Projekt:
   - Gehen Sie zu https://console.firebase.google.com/
   - Klicken Sie auf "Projekt hinzufügen"
   - Geben Sie einen Projektnamen ein und folgen Sie den Anweisungen

2. Firestore-Datenbank einrichten:
   - Wählen Sie im linken Menü "Firestore Database"
   - Klicken Sie auf "Datenbank erstellen"
   - Wählen Sie den Standort und den Startmodus (empfohlen: Testmodus für die Entwicklung)

3. Firebase-Konfiguration abrufen:
   - Klicken Sie im linken Menü auf "Projektübersicht"
   - Klicken Sie auf das Web-Symbol (</>) um eine Web-App zu registrieren
   - Geben Sie einen Namen für Ihre App ein und klicken Sie auf "Registrieren"
   - Kopieren Sie die Konfigurationsdaten und ersetzen Sie die Platzhalter in dieser Datei

4. Sicherheitsregeln für Firestore einrichten:
   - Gehen Sie zu "Firestore Database" > "Regeln"
   - Passen Sie die Regeln nach Bedarf an, z.B.:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /bookings/{booking} {
         allow read, write: if true; // Für Entwicklung
         // Für Produktion: allow read, write: if request.auth != null;
       }
     }
   }

5. Firebase-Authentifizierung einrichten (optional):
   - Wählen Sie im linken Menü "Authentication"
   - Klicken Sie auf "Erste Schritte"
   - Aktivieren Sie die gewünschten Anmeldemethoden (z.B. E-Mail/Passwort)

6. Deployment (optional):
   - Installieren Sie Firebase CLI: npm install -g firebase-tools
   - Führen Sie 'firebase login' aus
   - Initialisieren Sie Ihr Projekt: firebase init
   - Deployen Sie Ihre Website: firebase deploy
*/
