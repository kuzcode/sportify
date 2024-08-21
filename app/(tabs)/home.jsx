import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { Image, Text, Touchable, View } from "react-native";

import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getAllPosts, getLatestPosts, getCurrentUser } from "../../lib/appwrite";
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

  const { data: user, isLoading: trainingsLoading } = useAppwrite(getCurrentUser);

  return (
    <SafeAreaView className="bg-white h-full">
          <View className="flex my-6 px-4 space-y-1">
            <View className="flex justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-500">
                  Физкульты,
                </Text>
                <Text className="text-2xl font-psemibold text-black">
                  {user?.name}
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


            <Text className="text-2xl font-pbold">Тренировки</Text>
            <Text className="text-lg text-[#676767]">На сегодня планов пока нет :({"\n"}
              <Link href="/trainings"className="text-lg font-psemibold text-primary">Примите участие</Link> или <Link href="/create"className="text-lg font-psemibold text-primary">создайте свою</Link>.
            </Text>
              
            </View>
    </SafeAreaView>
  );
};

export default Home;
