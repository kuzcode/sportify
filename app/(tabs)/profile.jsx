import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import useAppwrite from "../../lib/useAppwrite";
import { getUserCompleted } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { types } from "../../constants/types";
import { icons } from "../../constants";

const Profile = () => {
  const router = useRouter();
  const [{ user }, setUser] = useState(useGlobalContext());
  const { data: completed } = useAppwrite(() => getUserCompleted(user?.$id));
  const [trainings, setTrainings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const reloadedUser = await useGlobalContext();
      console.log(reloadedUser)
        if (reloadedUser) {
          setUser({ ...user, ...reloadedUser }); //Example, update selectively.
          console.log(user)
      } else {
        console.error("Failed to reload user.");
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };


  useEffect(() => {
    if (completed[0]) {
      setTrainings(completed)
    }
  }, [completed]);


  const formatTime = time => {
    const hours = String(Math.floor(time / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };


  const settings = () => {
    router.push("/additional/settings");
  };

  const filteredList = types.filter(item => user?.sports?.includes(item.key));

  return (
    <ScrollView className="bg-[#000] h-full"
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        />
    }
    >
      <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
        <TouchableOpacity onPress={settings} className="flex w-full items-end mb-10">
          <Image source={icons.settings} tintColor={'#838383'} resizeMode="contain" className="w-6 h-6 mt-[20px]" />
        </TouchableOpacity>

        <View className="w-[140px] h-[140px] rounded-full mb-4 flex justify-center items-center">
          <Image
            source={{ uri: user?.imageUrl || 'default-image-url' }} 
            className="w-[100%] h-[100%] rounded-full"
            resizeMode="cover"
          />
        </View>

        <Text className="text-[24px] font-pbold text-white">{user?.name}</Text>
        <Text className="text-lg font-psemibold text-[#838383]">@{user?.username}</Text>
      </View>

      <View className="bg-[#3c87ff] mx-auto w-[91.545vw] h-[53vw] py-3 rounded-[16px] overflow-hidden">
        <Text className="text-white font-pregular mx-4 text-[#ffffff83] text-[24px] mt-1 leading-[24px]">клубная{`\n`}карта участника</Text>
        <Text className="text-white font-pbold text-[27vw] text-center absolute bottom-[-40px] left-[-20px] right-[-20px] text-nowrap">athlete</Text>
        <View className="mx-4 mt-2 absolute w-[83.545vw] bottom-4">
          {//<View style={styles.outerBlock}>
            //<View style={[styles.innerBlock, { width: blockWidth }]} />
            //<Text className="left-0 bottom-[3px] text-[18px] w-full text-center absolute font-pregular text-[#fff]">{percentage}%</Text>
          //</View>
}
        </View>
      </View>


      <View className="bg-[#111] mx-auto w-[91.545vw] py-3 rounded-[16px] mt-4">
  <Text className="text-white font-pbold mx-4 text-[19px]">О себе</Text>
  <View className="z-20 flex w-full flex-row flex-wrap px-4 pr-[12px]">
    <Text className="text-[#838383] mr-1 text-[16px] font-pregular">Интересуюсь:</Text>
    {filteredList.map(kind => (
      <View key={kind.id} className="bg-[#252525] border-[1px] border-[#292929] shadow-lg flex relative rounded-3xl mr-[4px] pt-[1px] pb-[3px] px-[9px] z-20">
        <Text className="font-pregular text-[#bdbdbd] text-[16px]">{kind.title}</Text>
      </View>
    ))}
  </View>
  {user?.bio !== '' && user?.bio !== null && (
    <Text className="text-[#838383] mx-4 text-[16px] font-pregular">Био: {user?.bio}</Text>
  )}
</View>
<TouchableOpacity className="bg-[#111] mx-3 rounded-2xl pt-2 pb-4 my-4 px-4" onPress={() => {router.push("/map")}}>
  <Text className="text-white font-pbold text-[19px]">тренировки</Text>
  {trainings.length === 0 ? (
    <View>
        <Text className="text-[#fff] text-center font-pbold m-0 bg-[#333] rounded-full mx-auto w-[64px] mt-[24px] h-[64px] text-[40px]">+</Text>
        <Text className="text-[#838383] text-center font-pregular text-[15px] mt-[8px]">начать первую</Text>
    </View>
  ) : (
  <View>
    {trainings.map(tr => {
      return(
      <View key={tr} className="bg-[#222] px-3 mt-3 rounded-lg pt-1 pb-2">
        <Text className="font-pregular text-[#838383] text-[20px]">{types[tr.typ].title}</Text>
        {tr.distance !== 0 && (
          <Text className="font-psemibold text-[#fff] text-[24px]">{tr.distance}км</Text>
        )}
        <Text className="text-[#838383] font-pregular text-[18px]">{formatTime(tr.time)}</Text>
      </View>
    )})}
  </View>
    )}
</TouchableOpacity>
    </ScrollView>
  );
};

export default Profile;