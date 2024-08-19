import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, TouchableOpacity, Text, Touchable, View } from "react-native";

import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getAllPosts, getLatestPosts } from "../../lib/appwrite";
import { EmptyState, SearchInput, Trending, VideoCard } from "../../components";

const Home = () => {
  const { data: posts, refetch } = useAppwrite(getAllPosts);
  const { data: latestPosts } = useAppwrite(getLatestPosts);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-white h-full">
          <View className="flex my-6 px-4 space-y-1">
            <View className="flex justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-500">
                  Физкульты,
                </Text>
                <Text className="text-2xl font-psemibold text-black">
                  Никита
                </Text>
              </View>

              <View className="mt-1.5 hidden">
                <Image
                  source={images.logoSmall}
                  className="w-9 h-10"
                  resizeMode="contain"
                />
              </View>
            </View>

            <TouchableOpacity className="bg-[#f43ee8] h-[100px] rounded-3xl flex justify-center">
            <Text className="font-psemibold text-xl text-white text-center ">Создать тренировку</Text>
            </TouchableOpacity>
            </View>
    </SafeAreaView>
  );
};

export default Home;
