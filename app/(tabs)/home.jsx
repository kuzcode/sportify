import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, Dimensions, Image, RefreshControl, StyleSheet } from "react-native";
import { ResizeMode, Video } from "expo-av";
import background from "../../assets/video.mp4"

import { useState } from "react";

import { useGlobalContext } from "../../context/GlobalProvider";
import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getUserTrackers, getAllUsers, getUserTrainings, getUserMeal } from "../../lib/appwrite";
import { types } from "../../constants/types";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { colors, meal } from "../../constants/types";

const Home = () => {
  const { width } = Dimensions.get("window");
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const { data: trainings, loading: trainingsLoading } = useAppwrite(() => getUserTrainings(user?.$id));
  const { data: trackers, loading: trackersLoading } = useAppwrite(() => getUserTrackers(user?.$id));
  const { data: users } = useAppwrite(getAllUsers);
  const mealFromDb = getUserMeal();


  const [refreshing, setRefreshing] = useState(false);

  //const [trainings, setTrainings] = useState(gotTrainings)
  //const [trackers, setTrackers] = useState(gotTrackers)
  //const [users, setUsers] = useState(gotUsers)

  const onRefresh = async () => {
    setRefreshing(true);
    try {
        //const refreshedTrainings = getUserTrainings(user?.$id);
        //const refreshedTrackers = getUserTrackers(user?.$id);
        //const refreshedUsers = getAllUsers();

        //setTrainings(refreshedTrainings);
        //setTrackers(refreshedTrackers);
        //setUsers(refreshedUsers);
    }
     catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const percentage = 80; // Значение от 1 до 100
  const blockWidth = percentage + '%';

  const styles = StyleSheet.create({
    text: {
      fontSize: 24,
      marginBottom: 10,
    },
    outerBlock: {
      width: '90%',
      height: 30,
      backgroundColor: meal[0].colorA,
      borderRadius: 10,
      overflow: 'hidden',
    },
    innerBlock: {
      height: '100%',
      backgroundColor: meal[0].colorB,
    }
  });

  return (
    <ScrollView 
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        />
    }
    className="h-full bg-[#000] pt-0">
          <View className="flex space-y-1">
          <View className="h-[54vw] w-full p-0 flex items-center">
            <Video 
          source={background}
          className="w-full h-full mt-3 absolute top-0 m-0"
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={ true }
            />

              <Text className="mt-1 mx-3 mb-10 font-psemibold text-[16px] text-[#ffffff90] text-center absolute top-4 hidden">физкультпривет, {user?.name}</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => {router.push('/bookmark')}} className="bg-[#fff] relative m-2 top-[45vw] w-[83%] pt-[15px] pb-[19px] rounded-[21px] z-30">
                <View className="flex flex-row items-center justify-center">
                  <Text className="text-center font-pregular text-[18px]">начать тренировку</Text>
                  <Image source={icons.play} tintColor={'#333'} className="w-[12px] h-[12px] ml-2 mb-[-4px]" />
                </View>
              </TouchableOpacity>


           <LinearGradient className="h-[18vw] relative top-[17vw] w-full z-10" colors={['#fff0', '#000']}></LinearGradient>

            </View>
            <View>
            <Text className="text-[16px] leading-[17px] mx-[16px] font-pregular relative text-[#838383] mt-[40px] text-center mb-4">здравствуй, чемпион! время идти на тренировку, всё, что не убивает, делает нас сильнее</Text>
            <TouchableOpacity className="flex flex-row justify-center items-center mb-3">
              <Text className="text-xl font-pbold relative text-[#fff] text-center mb-1">тренировки</Text>
              <Image 
            className="w-[25px] h-[25px] ml-2"
            source={icons.right}
            />
            </TouchableOpacity>
              <View>
      <ScrollView
        horizontal={true}
        snapToInterval={(width * 0.9225)} // Устанавливаем величину для "щелчка" на следующий элемент
        decelerationRate="fast" // Быстрая инерция прокрутки
        className="pl-4"
        showsHorizontalScrollIndicator={false} // Отключаем горизонтальную полосу прокрутки
      >

        {trainings.map(train => {
          const date = new Date(train.date);
          const months = [
            "января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря"
          ];
          const types = ['Бег 🏃', 'Качалка 🏋️‍♂️', 'Велоспед', 'Плавание'];

          const month = months[date.getUTCMonth()];
          const day = date.getUTCDate();
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          const formattedDate = `${day} ${month}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          const formattedType = types[Number(train.kind)];
          return (
            <View key={train.id} className="relative w-[90vw] mr-[3vw] h-[135px] bg-[#161616] px-4 py-2 rounded-3xl overflow-hidden mb-4">
              <>
              <Text className="font-pbold text-xl text-[#fff]">{train.title}</Text>
              <Text className="font-pregular text-xl text-[#838383]">{formattedDate}</Text>
              <Text className="font-pregular text-xl text-[#838383]">{formattedType}</Text></>
            </View>
          ); 
        })}

          <TouchableOpacity onPress={() => {router.push('/new')}} key={0} className="relative w-[90vw] mr-[3vw] h-[135px] bg-[#0b0b0b] px-4 py-2 rounded-3xl overflow-hidden mb-4">
          <Text className="text-[#838383] text-center font-pbold m-0 bg-[#131313] rounded-full mx-auto w-[64px] mt-[13px] h-[64px] text-[40px]">+</Text>
          <Text className="text-[#838383] text-center font-pregular text-[15px] mt-[8px]">создать тренировку</Text>
          </TouchableOpacity>
        </ScrollView>
          </View>
            <TouchableOpacity onPress={() => {router.push('/additional/trackers')}} className="flex flex-row justify-center items-center mb-4">
            <Text className="text-xl font-pbold relative text-[#fff] text-center">привычки</Text>
            <Image 
            className="w-[25px] h-[25px] ml-2"
            source={icons.right}
            />
            </TouchableOpacity>
            <ScrollView horizontal={true} 
              snapToInterval={(width * 0.9225)} // Устанавливаем величину для "щелчка" на следующий элемент
              decelerationRate="fast" // Быстрая инерция прокрутки
              showsHorizontalScrollIndicator={false} // Отключаем горизонтальную полосу прокрутки
              className="relative w-[100vw] h-[165px] rounded-3xl mb-2 pl-4">
            {trackers.map(track => {
  // Simplified content based on track.type
  let content = {};
  if (track.type === 0) { //  You need to define what type 0 represents
    content = { a: 'Default Text A', b: 'Default Text B' }; // Or handle it appropriately
  } else if (track.type === 1) {
    content = { a: `меньше ${track.name}`, b: `${track.done}/${track.goal} дней` };
  } else {
    content = { a: 'Unknown Type', b: '' }; // Handle unknown types gracefully
  }


  return (
    <TouchableOpacity
      key={track.$id}
      onPress={() => navigation.navigate('additional/track', { track })} // Removed / from the route
      className="relative w-[90vw] mr-[3vw] h-[165px] bg-[#161616] rounded-3xl overflow-hidden mb-4"
    >
      <LinearGradient
        colors={colors[track.color]}
        className="relative w-[90vw] mr-[3vw] h-[165px] bg-[#161616] px-4 py-2 rounded-3xl overflow-hidden mb-4"
      >
        <Text className="text-white font-pbold text-[20px]">{content.a}</Text>
        <Text className="text-[#ffffff83] font-pregular text-[20px]">{content.b}</Text>

        {track.type === 1 && (
          <View className="absolute flex flex-row bottom-3 px-4 w-[90vw] justify-between">
            <TouchableOpacity className="w-[38.5%] py-[5px] bg-[#ffffff20] border-[1px] border-[#ffffff25] rounded-xl">
              <Text className="font-pregular text-white text-center text-[15px]">сорвался</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[58.5%] py-[5px] bg-[#ffffff20] border-[1px] border-[#ffffff25] rounded-xl">
              <Text className="font-pregular text-white text-center text-[15px]">держусь</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
})}

            <TouchableOpacity className="pr-4" onPress={() => {router.push('/additional/newTrack')}}>
                <View className="relative w-[90vw] mr-[3vw] h-[165px] bg-[#0b0b0b] px-4 py-2 rounded-3xl overflow-hidden mb-4">
                <Text className="text-[#838383] text-center font-pbold m-0 bg-[#131313] rounded-full mx-auto w-[64px] mt-[24px] h-[64px] text-[40px]">+</Text>
                <Text className="text-[#838383] text-center font-pregular text-[15px] mt-[8px]">создать трекер привычки</Text>
                </View>
                </TouchableOpacity>
            </ScrollView>
            </View>


            <TouchableOpacity onPress={() => {router.push('/additional/meal')}} className="flex flex-row justify-center items-center mb-4">
            <Text className="text-xl font-pbold relative text-[#fff] text-center">питание</Text>
            <Image 
            className="w-[25px] h-[25px] ml-2"
            source={icons.right}
            />
            </TouchableOpacity>

            {
              mealFromDb[0]?.userId ? (
                <View className="bg-[#0b0b0b] w-[90vw] h-[200px] mx-auto rounded-3xl overflow-hidden">
              <LinearGradient start={{x: 0.6, y: 0.7}} end={{x: 0, y: 0}} className="h-full absolute left-0 top-0 w-[70vw] z-10" colors={['#fff0', meal[0].colorA]}></LinearGradient>
              <Text className="font-pbold mx-4 mt-2 z-10 text-white text-[20px]">{meal[0].title}</Text>
              <Text className="font-pregular mx-4 mt-0 z-10 text-[#ffffff60] text-[17px]">сегодня было 2 приёма пищи</Text>

            <View className="absolute bottom-4 left-4 right-4" style={styles.outerBlock}>
              <View style={[styles.innerBlock, { width: blockWidth }]} />
                <Text className="left-0 bottom-[3px] text-[18px] w-full text-center absolute font-pregular text-[#000]">2400/3000кл</Text>
              </View>
            </View>
              ) : (
                <TouchableOpacity onPress={() => {router.push('/additional/mealStart')}} className="bg-[#0b0b0b] w-[90vw] h-[200px] mx-auto rounded-3xl overflow-hidden">
                    <Text className="text-[#fff] font-pregular text-[20px] text-center mx-4 mt-[70px]">начните следить за своим питанием</Text>
                </TouchableOpacity>
              )
            }
            

            <TouchableOpacity className="mb-0 flex flex-row justify-center items-center">
            <Text className="text-xl font-pbold relative text-[#fff] mt-[16px] text-center mb-4">блогеры</Text>
            <Image 
            className="w-[25px] h-[25px] ml-2"
            source={icons.right}
            />
            </TouchableOpacity>

            <ScrollView horizontal={true} 
        snapToInterval={(width * 0.9225)} // Устанавливаем величину для "щелчка" на следующий элемент
        decelerationRate="fast" // Быстрая инерция прокрутки
        showsHorizontalScrollIndicator={false} // Отключаем горизонтальную полосу прокрутки
            className="relative w-[100vw] h-[135px] rounded-3xl pl-4 mb-[40px]">
              
            {users.map(user => {
              var newList = user?.sports.map(str => {
                const matchedObject = types.find(type => type.key === str);
                return matchedObject ? matchedObject.title : null; 
              }).filter(title => title !== null); // Удаляем значения null из нового списка
              
              return(
                <TouchableOpacity activeOpacity={1} key={user} onPress={() => navigation.navigate('otherProfile', { user })} className="w-[90vw] rounded-3xl h-full mr-[3vw] bg-[#0b0b0b]">
                <Image 
                source={{ uri: user.imageUrl }}
                className="w-[45vw] h-[135px] rounded-3xl absolute bg-[#252525]"
                />
                <LinearGradient start={{x: 0.6, y: 0}} end={{x: 0.73, y: 0}} className="h-full absolute left-0 top-0 w-[50vw] z-10" colors={['#fff0', '#0b0b0b']}></LinearGradient>
                <Text className="text-[#fff] text-[18px] font-pbold text-right mr-4 mt-2 z-20 mb-[6px]">{user.name}</Text>
                <View className="ml-[38vw] max-w-[52vw] z-20 flex w-full flex-row flex-wrap justify-end pr-[12px]">
                {newList.map(kind =>
                  <View className="bg-[#121212] border-[1px] border-[#191919] shadow-lg flex relative rounded-3xl m-[2px] pt-[1px] pb-[3px] px-[9px] z-20"><Text className="font-pregular text-[#bdbdbd]">{kind}</Text></View>
                )}
                </View>
              </TouchableOpacity>
            )})}
            </ScrollView>
            </View>
    </ScrollView>
  );
};

export default Home;
