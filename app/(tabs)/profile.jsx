import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";

import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getUserPosts, signOut } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { EmptyState, InfoBox, VideoCard } from "../../components";
import { useState } from "react";

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts } = useAppwrite(() => getUserPosts(user.$id));

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);

    router.replace("/sign-in");
  };

  console.log(posts[0])
  
  const types = [
    {
      title: 'Записи'
    },
    {
      title: 'О себе'
    }
  ]

  const [current, setCurrent] = useState(0)

  return (
    <ScrollView className="bg-[#f1f1f1] h-full">
          <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
              onPress={logout}
              className="flex w-full items-end mb-10"
            >
              <Image
                source={icons.logout}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <View className="w-[120px] h-[120px] border border-secondary rounded-full mb-4 flex justify-center items-center">
              <Image
                source={{ uri: user?.imageUrl }}
                className="w-[100%] h-[100%] rounded-full"
                resizeMode="cover"
              />
            </View>

            <Text className="text-2xl font-pbold">
              {user?.name}
            </Text>
            <Text className="text-lg font-psemibold text-[#616161]">
              @{user?.username}
            </Text>
          </View>

          <View className="flex flex-row w-full px-3 mb-3">
        {types.map(type =>
          <TouchableOpacity className="bg-[#fff] flex rounded-xl py-1 mx-1 flex-1" activeOpacity={0.7}> 
            <Text className="flex text-[16px] font-psemibold text-[#676767] text-center">{type.title}</Text>
          </TouchableOpacity>
        )}
    </View>

        {current == 0 ? (
          user.posts.length == 0 ? (
          <Text>Записей пока нет</Text>
          ) : (
            user.posts.map(post =>
              <View className="my-1 py-1 bg-white rounded-xl">
                {post.imageUrl && (
                  <Image
                  source={{ uri: post?.imageUrl }}
                  className="w-full h-[75vw] rounded-xl"
                  resizeMode="cover"
                />
                )}
                <Text className="text-lg mx-4">{post.caption}</Text>
                <View>
                  <Text>{post?.likes}</Text>
                </View>
              </View>
            )
          )
        ) : (
          <Text>hui</Text>
        )}
    </ScrollView>
  );
};

export default Profile;
