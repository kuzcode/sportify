import { useEffect } from "react";
import { useFonts } from 'expo-font';
import NetInfo from '@react-native-community/netinfo';
import { Stack, router } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';
import GlobalProvider from "../context/GlobalProvider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
StatusBar.setHidden(true);

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Installed-Regular": require("../assets/fonts/pregular.otf"),
    "Installed-Semibold": require("../assets/fonts/psemibold.otf"),
    "Installed-Bold": require("../assets/fonts/pbold.otf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <GlobalProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, navigationBarColor: 'black' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, navigationBarColor: '#111' }} />
        <Stack.Screen name="additional" options={{ headerShown: false, navigationBarColor: 'black' }} />
        <Stack.Screen name="index" options={{ headerShown: false, navigationBarColor: '#111' }} />
      </Stack>
    </GlobalProvider>
  );
};

export default RootLayout;
