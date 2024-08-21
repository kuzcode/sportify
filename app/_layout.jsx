import { useEffect } from "react";
import { useFonts } from "expo-font";
import "react-native-url-polyfill/auto";
import { SplashScreen, Stack } from "expo-router";

import GlobalProvider from "../context/GlobalProvider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/bold.otf"),
    "Poppins-Bold": require("../assets/fonts/bold.otf"),
    "Poppins-ExtraBold": require("../assets/fonts/bold.otf"),
    "Poppins-ExtraLight": require("../assets/fonts/regular.otf"),
    "Poppins-Light": require("../assets/fonts/regular.otf"),
    "Poppins-Medium": require("../assets/fonts/medium.otf"),
    "Poppins-Regular": require("../assets/fonts/regular.otf"),
    "Poppins-SemiBold": require("../assets/fonts/bold.otf"),
    "Poppins-Thin": require("../assets/fonts/regular.otf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <GlobalProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="search/[query]" options={{ headerShown: false }} />
      </Stack>
    </GlobalProvider>
  );
};

export default RootLayout;
