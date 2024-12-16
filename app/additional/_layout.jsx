import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Loader } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";


const AdditionalLayout = () => {
  const { loading, isLogged } = useGlobalContext();

  if (!loading && !isLogged) return <Redirect href="/sign-in" />;

  return (
    <>
      <Stack>
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="map"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="newTrack"
          options={{
            headerShown: false,
          }}
        />
      <Stack.Screen
          name="profileSettings"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="trackers"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="track"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="mealStart"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="meal"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="typesOfSport"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="otherProfile"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <Loader isLoading={loading} />
      <StatusBar backgroundColor="#000" style="light" />
    </>
  );
};

export default AdditionalLayout;
