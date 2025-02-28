import { useState, useRef } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { format, formatDistance, isToday, parse } from 'date-fns';
import ru from 'date-fns/locale/ru'; // Импортируем локаль для русского языка
import { icons } from "../../constants";
import { getNews } from "../../lib/appwrite";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import useAppwrite from "../../lib/useAppwrite";

const Create = () => {
  const { data: news } = useAppwrite(getNews);
  const [communities, setCommunities] = useState([])
  const [newsShown, setNewsShown] = useState(false);
  const [currentNews, setCurrentNews] = useState(false);
  const scrollViewRef = useRef();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [openedFrom, setOpenedFrom] = useState(0);

  const handleScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(yOffset);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    if (isNaN(date)) {
      return "дата не указана"; // Обработка некорректной даты
    }

    const now = new Date();
    if (isToday(date)) {
      return formatDistance(date, now, { addSuffix: true, locale: ru });
    } else if (date.getDate() === now.getDate() - 1) {
      return `вчера в ${format(date, 'HH:mm', { locale: ru })}`;
    } else {
      return format(date, 'd MMMM в HH:mm', { locale: ru });
    }
  };

  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text onPress={() => Linking.openURL(part)} className="text-[#90d8ff] font-pregular text-[20px]">{part}</Text>
        );
      }

      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={50} // Обновляем событие прокрутки каждые 50 мс
      className="bg-[#000] pt-10 px-4">
      {newsShown && (
        <View className="bg-black w-[100vw] h-full fixed top-0 z-10">
          <TouchableOpacity className="absolute right-[16px] top-0" onPress={() => {
            setNewsShown(false);
            scrollViewRef.current.scrollTo({ y: openedFrom, animated: true });
          }}>
            <Image
              source={icons.close}
              className="w-8 h-8 top-0 right-0 mr-4 z-10 "
              tintColor={'white'}
            />
          </TouchableOpacity>
          <Text className="text-white font-pbold text-[22px] mb-0 mr-[60px]">{currentNews.title}</Text>
          <Text className="text-[#838383] font-pregular text-[18px] mb-4">{formatDate(currentNews.Date)}</Text>
          {currentNews.imageUrl && (
            <Image
              source={{ uri: currentNews.imageUrl }}
              className="w-auto mr-4 h-[200]"
            />
          )}
          <Text className="text-white font-pregular text-[20px] mt-4 mr-8">{renderTextWithLinks(currentNews.caption)}</Text>
        </View>
      )}



      <Text className="text-white font-pbold text-[27px] mb-3">клуб</Text>

      <TouchableOpacity
        onPress={() => { router.push('/additional/card') }}
        className="bg-[#3c87ff] mx-auto w-[91.545vw] h-[53vw] py-3 rounded-[10px] overflow-hidden">
        <Text className="text-white font-pregular mx-4 text-[#ffffff83] text-[24px] mt-1 leading-[24px]">клубная{`\n`}карта участника</Text>
        <Text className="text-white font-pbold text-[27vw] text-center absolute bottom-[-40px] left-[-20px] right-[-20px] text-nowrap">athlete</Text>
        <View className="mx-4 mt-2 absolute w-[83.545vw] bottom-4">
          {//<View style={styles.outerBlock}>
            //<View style={[styles.innerBlock, { width: blockWidth }]} />
            //<Text className="left-0 bottom-[3px] text-[18px] w-full text-center absolute font-pregular text-[#fff]">{percentage}%</Text>
            //</View>
          }
        </View>
      </TouchableOpacity>

      {communities.length === 0 ? (
        <TouchableOpacity onPress={() => { router.push('/additional/communities') }} className="bg-[#111] mt-4 rounded-3xl flex flex-row px-[16px] py-[16px] items-center">
          <Image
            className="w-10 h-10 mr-[16px]"
            source={icons.neww}
            tintColor={'#fff'}
          />
          <View>
            <Text className="text-white text-[22px] font-psemibold">вступи в сообщество</Text>
            <Text className="text-[#828282] text-[18px] font-pregular">или создай своё</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View>
          {communities.map(comm =>
            <TouchableOpacity key={comm}>

            </TouchableOpacity>
          )}
        </View>
      )}


      <TouchableOpacity
        onPress={() => { router.push('/additional/programms') }}
        className="bg-[#111] mt-4 rounded-3xl flex flex-row px-[16px] py-[16px] items-center">
        <Image
          className="w-10 h-10 mr-[16px]"
          source={icons.dumbbell}
          tintColor={'#fff'}
        />
        <View>
          <Text className="text-white text-[22px] font-psemibold">программы тренировок</Text>
          <Text className="text-[#828282] text-[18px] font-pregular">найди или создай свою</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { router.push('/additional/music') }}
        className="bg-[#111] mt-4 rounded-3xl flex flex-row px-[16px] py-[16px] items-center">
        <Image
          className="w-10 h-10 mr-[16px]"
          source={icons.music}
          tintColor={'#fff'}
        />
        <View>
          <Text className="text-white text-[22px] font-psemibold">музыка</Text>
          <Text className="text-[#828282] text-[18px] font-pregular pr-4">наши плейлисты для твоих тренировок</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { router.push('/additional/leaders') }}
        className="bg-[#111] mt-4 rounded-3xl flex flex-row px-[16px] py-[16px] items-center">
        <Image
          className="w-10 h-10 mr-[16px]"
          source={icons.trophy}
          tintColor={'#fff'}
        />
        <View>
          <Text className="text-white text-[22px] font-psemibold">лидерборд</Text>
          <Text className="text-[#828282] text-[18px] font-pregular pr-10">кто тренируется больше всех в стране</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { router.push('/additional/people') }}
        className="bg-[#111] mt-4 rounded-3xl flex flex-row px-[16px] py-[16px] items-center">
        <Image
          className="w-10 h-10 mr-[16px]"
          source={icons.neww}
          tintColor={'#fff'}
        />
        <View>
          <Text className="text-white text-[22px] font-psemibold">люди</Text>
          <Text className="text-[#828282] text-[18px] font-pregular pr-10">знакомства и совместные тренирвоки</Text>
        </View>
      </TouchableOpacity>

      <Text className="text-white font-pbold text-[27px] mb-3 mt-4">новости</Text>
      {news.map(item =>
        <TouchableOpacity onPress={() => {
          setCurrentNews(item);
          setNewsShown(true);
          setOpenedFrom(scrollPosition)
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }} className="bg-[#111] rounded-3xl mb-10">
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-full h-[200] rounded-t-3xl"
            />
          )}
          <Text className="text-white font-pbold text-[20px] mt-1 mx-4">{item.title}</Text>
          <Text className="text-[#838383] font-pregular text-[18px] mb-4 mx-4">{formatDate(item.Date)}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

export default Create;
