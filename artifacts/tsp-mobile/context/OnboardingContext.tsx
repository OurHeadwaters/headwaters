import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext } from "react";

import { ONBOARDING_KEY } from "@/components/OnboardingScreen";

interface OnboardingContextValue {
  replayTour: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  onReplay,
}: {
  children: React.ReactNode;
  onReplay: () => void;
}) {
  const replayTour = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    onReplay();
  }, [onReplay]);

  return (
    <OnboardingContext.Provider value={{ replayTour }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
