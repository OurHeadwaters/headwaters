import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const STORAGE_KEY_NAME = "hw-profile-name";
const STORAGE_KEY_BIO = "hw-profile-bio";
const DEFAULT_NAME = "Bobbie";

interface ProfileContextValue {
  name: string;
  bio: string;
  setName: (name: string) => void;
  setBio: (bio: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_NAME) || DEFAULT_NAME;
  });

  const [bio, setBioState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_BIO) || "";
  });

  const setName = useCallback((newName: string) => {
    const trimmed = newName.trim() || DEFAULT_NAME;
    localStorage.setItem(STORAGE_KEY_NAME, trimmed);
    setNameState(trimmed);
  }, []);

  const setBio = useCallback((newBio: string) => {
    const trimmed = newBio.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_BIO, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY_BIO);
    }
    setBioState(trimmed);
  }, []);

  return (
    <ProfileContext.Provider value={{ name, bio, setName, setBio }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

export function getProfileName(): string {
  return localStorage.getItem(STORAGE_KEY_NAME) || DEFAULT_NAME;
}

export function getProfileBio(): string {
  return localStorage.getItem(STORAGE_KEY_BIO) || "";
}
