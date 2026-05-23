import { useState, useCallback } from "react";

const STORAGE_KEY = "hw-profile-name";
const DEFAULT_NAME = "Bobbie";

export function useProfile() {
  const [name, setNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME;
  });

  const setName = useCallback((newName: string) => {
    const trimmed = newName.trim() || DEFAULT_NAME;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setNameState(trimmed);
  }, []);

  return { name, setName };
}

export function getProfileName(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME;
}
