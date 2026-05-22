import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts as useDMSansFonts,
} from "@expo-google-fonts/dm-sans";
import {
  Fraunces_700Bold,
  useFonts as useFramuncesFonts,
} from "@expo-google-fonts/fraunces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setBaseUrl } from "@workspace/api-client-react";
import { MobileAuthProvider } from "@/context/MobileAuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingScreen, ONBOARDING_KEY } from "@/components/OnboardingScreen";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { DownloadProvider } from "@/context/DownloadContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { V4VProvider } from "@/context/V4VContext";
import { StompProvider } from "@/context/StompContext";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="episode/[slug]" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="transformation/[slug]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="queue" options={{ headerShown: false, animation: "slide_from_bottom", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [dmSansLoaded, dmSansError] = useDMSansFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [frauncesLoaded, frauncesError] = useFramuncesFonts({
    Fraunces_700Bold,
  });

  const fontsLoaded = dmSansLoaded && frauncesLoaded;
  const fontError = dmSansError || frauncesError;

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setShowOnboarding(value === null);
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, onboardingChecked]);

  if ((!fontsLoaded && !fontError) || !onboardingChecked) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MobileAuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <OnboardingProvider onReplay={() => setShowOnboarding(true)}>
                  <DownloadProvider>
                    <HistoryProvider>
                      <V4VProvider>
                        <StompProvider>
                          <PlayerProvider>
                            <RootLayoutNav />
                            <OnboardingScreen
                              visible={showOnboarding}
                              onDone={() => setShowOnboarding(false)}
                            />
                          </PlayerProvider>
                        </StompProvider>
                      </V4VProvider>
                    </HistoryProvider>
                  </DownloadProvider>
                </OnboardingProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </MobileAuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
