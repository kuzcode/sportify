import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { View, Text, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "../constants";
import { CustomButton, Loader } from "../components";
import { useGlobalContext } from "../context/GlobalProvider";

const Welcome = () => {
  const { loading, isLogged } = useGlobalContext();
  if (!loading && isLogged) return <Redirect href="/home" />;

  return (
    <SafeAreaView className="bg-[#111] h-full">
      <Loader isLoading={loading} />

      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}
      >
        <View className="w-full flex justify-center items-center h-full px-4">
          <Image
            source={images.cards}
            className="max-w-[380px] w-full h-[298px]"
            resizeMode="contain"
          />

          <View className="relative mt-5 w-[100vw] px-4">
            <Text className="text-3xl font-pbold text-left text-[#fff]">
              <Text className="text-[#3c87ff]">атлет</Text> - ваш спорт в Беларуси
            </Text>

          <Text className="text-[18px] font-pregular text-[#838383] mt-4 text-left">
            совместные тренировкии, новые знакомства, советы по питанию!
          </Text>
          </View>


          <CustomButton
            title="начать путь"
            handlePress={() => router.push("/sign-up")}
            containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
};

export default Welcome;
