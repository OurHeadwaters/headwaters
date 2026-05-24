import { createContext, useContext, useState, useEffect, useRef } from "react";

interface GordContextValue {
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
}

const GordContext = createContext<GordContextValue>({
  pageTitle: null,
  setPageTitle: () => {},
});

export function GordProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  return (
    <GordContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </GordContext.Provider>
  );
}

export function useGordContext() {
  return useContext(GordContext);
}

export function useGordPageTitle(title: string | null | undefined) {
  const { setPageTitle } = useGordContext();
  const titleRef = useRef(title);
  titleRef.current = title;

  useEffect(() => {
    if (title) setPageTitle(title);
  }, [title, setPageTitle]);

  useEffect(() => {
    return () => {
      setPageTitle(null);
    };
  }, [setPageTitle]);
}
