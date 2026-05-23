import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "hw-profile-name";
const DEFAULT_NAME = "Bobbie";

function readName(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyAll() {
  listeners.forEach((l) => l());
}

export function useProfile() {
  const name = useSyncExternalStore(subscribe, readName, readName);

  const setName = useCallback((newName: string) => {
    const trimmed = newName.trim() || DEFAULT_NAME;
    localStorage.setItem(STORAGE_KEY, trimmed);
    notifyAll();
  }, []);

  return { name, setName };
}

export function getProfileName(): string {
  return readName();
}
