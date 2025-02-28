import { Redirect, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { Loader } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from "react";

const AuthLayout = () => {
  const { loading, isLogged } = useGlobalContext();
  const [net, setNet] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setNet(false)
        router.push('/noNet')
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!loading && net && isLogged) return <Redirect href="/home" />;

  return (
    <>
      <Stack>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="noNet"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <Loader isLoading={loading} />
      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default AuthLayout;
