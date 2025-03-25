import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, Dimensions, Image, StyleSheet, Vibration, ActivityIndicator } from "react-native";
import { ResizeMode, Video } from "expo-av";
import background from "../../assets/video.mp4"

import { useState, useRef, useEffect } from "react";

import { useGlobalContext } from "../../context/GlobalProvider";
import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getAllQuotes, getUserTrainings, getUserTrackers, getAllUsers, getUserMeal, likeQuote, getAllCommunities, getUserCalendar, getUserNotifications, getHot, getUserById, getCommunityById, updateTracker, getHotTrainings, getCalendarPlan, getComPosts, getUserCommunities, getUserFriends, sendNotif, sendNotification, getHotPosts, getRecommendedTrainings } from "../../lib/appwrite";
import { types } from "../../constants/types";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { colors, meal } from "../../constants/types";
import moment from 'moment';
import { exercises } from "../../constants/exercises";
import WebView from "react-native-webview";
import mapTemplate from '../map-template';
import Svg, { Polyline } from 'react-native-svg';
import { fr } from "date-fns/locale";

const CurrentDate = moment().date(); // Получаем текущее число
const daysInMonth = moment().daysInMonth(); // Получаем количество дней в текущем месяце

const Home = () => {
  const { width } = Dimensions.get("window");
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const { data: trainings, loading: trainingsLoading } = useAppwrite(() => getUserTrainings(user?.$id));
  const [trackers, setTrackers] = useState([])

  const [mealForm, setMealForm] = useState({});
  const [communities, setCommunities] = useState([])
  const [combinedData, setCombinedData] = useState([])

  const [recsShown, setRecsShown] = useState(false);

  const [moreShown, setMoreShown] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [shareShown, setShareShown] = useState(false);
  const [more, setMore] = useState({});

  const [totalCount, setTotalCount] = useState(0);
  const [current, setCurrent] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [openedFrom, setOpenedFrom] = useState(0);
  const [calendar, setCalendar] = useState({});
  const [notifications, setNotifications] = useState([])
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [ucoms, setUcoms] = useState([])
  const [hot, setHot] = useState([])
  const [plan, setPlan] = useState([])
  const [posts, setPosts] = useState([])
  const [comPosts, setComPosts] = useState([])
  const [friends, setFriends] = useState([])
  const [frList, setFrList] = useState([])

  const [detail, setDetail] = useState({});
  const [detailShown, setDetailShown] = useState(false);

  const hanScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(yOffset);
  };

  const webRef = useRef(null);

  const w = 100;
  const height = 100;

  const coordinates = [
    { x: 1, y: 1.2 },
    { x: 2, y: 18 },
    { x: 9, y: 20 },
    { x: 1, y: 1 },
  ]

  // Преобразуем координаты в относительные по размеру квадрата
  const points = coordinates.map(coord => {
    const x = (coord.x / 100) * width; // предполагаем, что значения x варьируются от 0 до 100
    const y = height - (coord.y / 100) * height; // инвертируем y, чтобы верхний край был 0
    return `${x},${y}`;
  }).join(' ');

  useEffect(() => {
    const fetchCommunities = async () => {
      const data = await getAllCommunities();
      setCommunities(data);
    };

    fetchCommunities();
  }, []);

  useEffect(() => {
    const fetchUComs = async () => {
      const data = await getUserCommunities(user.$id);
      set(data);
    };

    fetchUComs();
  }, []);

  useEffect(() => {
    const fetchTr = async () => {
      const data = await getUserTrackers(user.$id);
      const upd = data.map(tracker => ({
        ...tracker,
        todayDone: tracker.today === 0 ? false : true,
      }));

      setTrackers(upd);
    };
    fetchTr();
  }, []);


  useEffect(() => {
    const fetchAllData = async () => {
      if (frList.length === 0) {
        const recTr = await getRecommendedTrainings(0);
        const enrichedRecTrainings = await Promise.all(recTr.map(async (item) => {
          const user = await getUserById(item.userId);
          return { ...item, name: user.documents[0].name, imageUrl: user.documents[0].imageUrl, from: 0, recommended: true };
        }));

        const comPostsData = await getComPosts(['67a875d30003adba09c9']);
        const enrichedComPosts = await Promise.all(comPostsData.map(async (item) => {
          const community = await getCommunityById('67a875d30003adba09c9')
          return { ...item, name: community.name, imageUrl: community.imageUrl, verif: community.isVerif, from: 2 };
        }));

        const allData = [...enrichedRecTrainings, ...enrichedComPosts];
        const shuffledData = allData.sort(() => Math.random() - 0.5);

        setCombinedData(shuffledData);
      }

      else {
        const trainingsData = await getHotTrainings(frList);
        const postsData = await getHotPosts(frList);
        const comPostsData = await getComPosts(['67a875d30003adba09c9']);

        var enrichedTrainings = [];
        if (frList.length > 0) {
          enrichedTrainings = await Promise.all(trainingsData.map(async (item) => {
            const user = await getUserById(item.userId);
            return { ...item, name: user.documents[0].name, imageUrl: user.documents[0].imageUrl, from: 0 };
          }));
        }

        const enrichedPosts = await Promise.all(postsData.map(async (item) => {
          const user = await getUserById(item.creator);
          return { ...item, name: user.documents[0].name, imageUrl: user.documents[0].imageUrl, from: 1 };
        }));

        const enrichedComPosts = await Promise.all(comPostsData.map(async (item) => {
          const community = await getCommunityById('67a875d30003adba09c9')
          return { ...item, name: community.name, imageUrl: community.imageUrl, verif: community.isVerif, from: 2 };
        }));

        const allData = [...enrichedTrainings, ...enrichedPosts, ...enrichedComPosts];
        const shuffledData = allData.sort(() => Math.random() - 0.5);

        if (shuffledData.length < 5) {
          const recTr = await getRecommendedTrainings(0);
          const enrichedRecTrainings = await Promise.all(recTr.map(async (item) => {
            const user = await getUserById(item.userId);
            return { ...item, name: user.documents[0].name, imageUrl: user.documents[0].imageUrl, from: 0, recommended: true };
          }));

          // Добавляем недостающие записи
          const remainingCount = 20 - shuffledData.length;
          const additionalData = enrichedRecTrainings.slice(0, remainingCount);

          setCombinedData([...shuffledData, ...additionalData]);
        } else {
          setCombinedData(shuffledData);
        }
      }
    };

    fetchAllData();
  }, [frList]);


  useEffect(() => {
    const fetchHot = async () => {
      const data = await getHot();

      const enrichedData = await Promise.all(data.map(async (item) => {
        if (item.creatorType === 0) {
          const userr = await getUserById(item.creator);
          return { ...item, name: userr.documents[0].name, imageUrl: userr.documents[0].imageUrl };
        } else if (item.creatorType === 1) {
          // Если creatorType === 1, делаем запрос getCommunityById
          const community = await getCommunityById(item.creator);
          return { ...item, name: community.documents[0].name, imageUrl: community.documents[0].imageUrl };
        }
        else {// Возвращаем объект без изменений, если ни одно из условий не выполнено
          return item;
        }
      }));

      setHot(enrichedData);
    };

    fetchHot();
  }, []);


  const fetchMealData = () => {
    try {
      const data = getUserMeal();
      setMealForm(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    async function fetchFriends() {
      try {
        const data = await getUserFriends(user.$id);
        setFrList(data[0].friends);

        const enriched = await Promise.all(data[0].friends.map(async (item) => {
          const us = await getUserById(item);
          return { userId: item, name: us.documents[0].name, imageUrl: us.documents[0].imageUrl };
        }));

        setFriends(enriched);
      } catch (error) {
        console.error('Error fetching user friends: ', error);
      }
    }

    fetchFriends();
  }, [user])


  const getMinMax = (coordinates) => {
    const xValues = coordinates.map(coord => coord.x);
    const yValues = coordinates.map(coord => coord.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    return { minX, maxX, minY, maxY };
  };

  const normalizeCoordinates = (coordinates, width, height) => {
    const { minX, maxX, minY, maxY } = getMinMax(coordinates);

    return coordinates.map(coord => {
      const x = ((coord.x - minX) / (maxX - minX)) * width;
      const y = height - (((coord.y - minY) / (maxY - minY)) * height);
      return `${x},${y}`;
    }).join(' ');
  };


  useEffect(() => {
    fetchMealData();
  }, []);

  const [motivation, setMotivation] = useState([]);

  const [likedQuotes, setLikedQuotes] = useState([]);

  const like = (id, increment) => {
    setMotivation((prevQuotes) =>
      prevQuotes.map((quote) => {
        if (quote.id === id) {
          const updatedLikeCount = increment ? quote.likeCount + 1 : quote.likeCount - 1;
          return { ...quote, likeCount: updatedLikeCount, isLikedByUser: increment };
        }
        return quote;
      })
    );
    likeQuote(id, user.$id)
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const quotes = await getAllQuotes(user.$id);
        setMotivation(quotes);

        quotes.map(a => {
          if (a.isLikedByUser == true) {
            setLikedQuotes(
              [...likedQuotes, a.id]
            );
          }
        })
      } catch (err) {
      }
    };

    fetchQuotes();
  }, []);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await getUserCalendar(user.$id);
        setCalendar(res[0]);
      } catch (err) {
      }
    };

    fetchCalendar();
  }, [user]);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await getCalendarPlan(calendar?.$id);
        setPlan(res)
      } catch (err) {
      }
    };

    if (user) {
      fetchPlan();
    }
  }, [calendar]);

  const outerScrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    if (contentOffset.y < 0) {
      Vibration.vibrate(100); // Длительность вибрации в миллисекундах
      // Прокрутка только для внешнего scrollView
      outerScrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };


  const currentMonth = moment();
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const today = moment();

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = startOfMonth.day();

  const days = [];

  // Добавляем дни предыдущего месяца
  for (let i = startDay; i > 0; i--) {
    days.push({
      day: startOfMonth.date() - i + 1,
      isCurrentMonth: false
    });
  }

  // Добавляем дни текущего месяца
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true
    });
  }

  // Добавляем дни следующего месяца
  const endDay = endOfMonth.day();
  for (let i = 1; i < 7 - endDay; i++) {
    days.push({
      day: i,
      isCurrentMonth: false
    });
  }

  const rows = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

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

  const formatTime = time => {
    const hours = String(Math.floor(time / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const [lastTriggeredOffset, setLastTriggeredOffset] = useState(0);

  const handleScrollY = async (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // Проверяем, если offsetY больше последнего триггера на 600
    if (offsetY >= lastTriggeredOffset + 600) {
      setLastTriggeredOffset(offsetY); // Обновляем значение lastTriggeredOffset

      // Запускаем процесс
      setTotalCount(prevCount => prevCount + 1); // Обновляем totalCount
      console.log(totalCount + 1); // Логируем новое значение

      const gotNewRec = await getRecommendedTrainings(totalCount + 1);

      // Используем Set для хранения уже добавленных $id
      const existingIds = new Set(combinedData.map(item => item.$id)); // Существующие $id из combinedData

      const enrichedRecTrainings = await Promise.all(gotNewRec.map(async (item) => {
        const user = await getUserById(item.userId);
        return {
          ...item,
          name: user.documents[0].name,
          imageUrl: user.documents[0].imageUrl,
          from: 0,
          recommended: true
        };
      }));

      // Фильтруем новые данные, чтобы исключить дубли
      const uniqueTrainings = enrichedRecTrainings.filter(item => !existingIds.has(item.$id));

      // Добавляем только уникальные данные в combinedData
      if (uniqueTrainings.length > 0) {
        setCombinedData(prevData => [...prevData, ...uniqueTrainings]);
      }
    }
  };


  const calculatePace = (time, distance) => {
    if (distance === 0) return "--:--";

    const paceInMinutes = time / 60 / distance;
    const minutes = Math.floor(paceInMinutes);
    const seconds = Math.round((paceInMinutes - minutes) * 60);

    if (time / 60 / distance < 200) {
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    else {
      return "--:--";
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

  const getNotificationCount = () => {
    const readCount = notifications.filter(item => item.isRead).length;

    return readCount;
  }

  const week = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  const plans = [
    [
      {
        name: 'бег',
        icon: 'music'
      }
    ],
    [],
    [],
    [
      {
        name: 'бег',
        icon: 'neww'
      }
    ],
    [],
    [
      {
        name: 'бег',
        icon: 'home'
      },
      {
        name: 'бег',
        icon: 'music'
      }
    ],
    [],
  ]

  const getCurrentWeekday = () => {
    const newDate = new Date();
    const day = newDate.getDay(); // 0 (воскресенье) - 6 (суббота)
    return (day === 0) ? 6 : day - 1; // Преобразуем: воскресенье -> 6, остальные дни смещаем на 1
  };


  useEffect(() => {
    async function fetchNotifs() {
      try {
        const got = await getUserNotifications(user.$id);
        setNotifications(got);
        setNotificationsCount(got.filter(item => !item.isRead).length);
      } catch (error) {
        console.error('Error fetching notifications: ', error);
      }
    }

    fetchNotifs();
  }, []);


  useEffect(() => {
    const formattedRoutes = detail?.coordinates?.map(coord => [coord.x, coord.y]);
    webRef?.current?.injectJavaScript(`flyToUserLocation({"latitude": ${detail?.coordinates[0]?.x}, "longitude": ${detail?.coordinates[0]?.y}});`);
    webRef?.current?.injectJavaScript(`drawRoutes([${JSON.stringify(formattedRoutes)}]);`);
  }, [detail, loaded])


  const isLastUpdatedOld = (lastUpdated) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Устанавливаем дату на вчера
    return new Date(lastUpdated) <= yesterday; // Сравниваем даты
  };

  const Graph = ({ coordinates }) => {
    const width = 90;
    const height = 90;

    // Извлечение координат x и y
    const xs = coordinates.map(coord => coord.x);
    const ys = coordinates.map(coord => coord.y);

    // Определение максимальных и минимальных значений
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    // Преобразуем координаты в относительные по размеру квадрата
    const points = coordinates.map(coord => {
      const x = ((coord.x - xMin) / (xMax - xMin)) * width; // Масштабируем x
      const y = height - ((coord.y - yMin) / (yMax - yMin)) * height; // Инвертируем и масштабируем y
      return `${x},${y}`;
    }).join(' ');

    return (
      <Svg height={height} width={width}>
        <Polyline
          points={points}
          stroke="#3c87ff"
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    );
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date; // Разница во времени в миллисекундах
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60)); // Разница в минутах
    const diffInHours = Math.floor(diffInMinutes / 60); // Разница в часах
    const diffInDays = Math.floor(diffInMinutes / (60 * 24)); // Разница в днях
    const diffInMonths = Math.floor(diffInDays / 30); // Разница в месяцах

    if (diffInMinutes < 60) {
      return `${diffInMinutes}мин назад`;
    } else if (diffInHours < 24) {
      return `${diffInHours}ч назад`;
    } else if (diffInDays < 7) {
      return `${diffInDays}дн назад`;
    } else {
      const options = { month: 'long', day: 'numeric' };
      const formattedDate = new Intl.DateTimeFormat('ru-RU', options).format(date);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${formattedDate}, ${hours}:${minutes}`;
    }
  };

  return (
    <ScrollView
      scrollEventThrottle={50} // Обновляем событие прокрутки каждые 50 мс
      contentOffset={{ y: width, x: 0 }}
      decelerationRate="fast"
      className="h-[100vh]"
      onScroll={handleScrollY}
      ref={outerScrollViewRef}
    >
      <View className="bg-[#f3f7f8] h-[100vw] w-[100vw]">
        <Text className="font-pregular text-[16px] mt-8 mx-10 text-center">квадрат мотивации</Text>

        {motivation.length == 0 && (
          <Text className="text-[19px] font-pbold text-center mt-[60px]">какая-то проблема :(</Text>
        )}

        <ScrollView
          horizontal={true}
          snapToInterval={10}
          decelerationRate="fast"
        >
          {motivation.map((item, index) =>
            <View key={item.id} className="w-[100vw]">
              {item.img == null ? (
                <View className="flex items-center justify-center h-full absolute w-full top-[-22px]">
                  <Text className="font-pbold mx-10 text-[20px] text-center">{item.quote}</Text>
                </View>
              ) : (
                <View className="flex items-center justify-center h-full absolute w-full top-[-26px]">
                  <Image
                    source={{ uri: item.img }}
                    className="w-[80vw] h-[45vw]"
                  />
                  <Text className="font-pregular mt-2 mx-8 text-[18px] text-center">{item.quote}</Text>
                </View>
              )}

              <View className="absolute bottom-4 mx-auto w-full">
                {likedQuotes.includes(item.id) ? (
                  <TouchableOpacity onPress={() => {
                    setLikedQuotes(prevLikedQuotes =>
                      prevLikedQuotes.filter(quote => quote !== item.id)
                    );
                    like(item.id, false)
                  }}
                    className="bg-primary px-2 h-10 flex justify-center items-center rounded-xl mx-auto flex-row">
                    <Image
                      source={icons.heart}
                      className="w-6 h-6"
                      tintColor={'#fff'}
                    />
                    <Text className="font-pbold text-[17px] ml-[7px] text-[#fff]">{item.likeCount}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => {
                    setLikedQuotes(prevLikedQuotes => [...prevLikedQuotes, item.id]);
                    like(item.id, true)
                  }}
                    className="bg-[#e8e8e8] px-2 h-10 flex justify-center items-center rounded-xl mx-auto mt-[160px] flex-row">
                    <Image
                      source={icons.heart}
                      className="w-6 h-6"
                      tintColor={'#888'}
                    />
                    <Text className="font-pregular text-[17px] ml-2 text-[#333]">{item.likeCount}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {detailShown && (
        <View className="bg-black w-[100vw] h-full fixed top-0 z-10">
          <TouchableOpacity className="absolute right-[16px] top-0 z-20" onPress={() => { setDetailShown(false) }}>
            <Image
              source={icons.close}
              className="w-8 h-8 top-8 right-0 mr-4 z-10 "
              tintColor={'white'}
            />
          </TouchableOpacity>

          <Text className="text-[#838383] font-pregular text-[20px] mt-10 mx-4">{types[detail.typ].title}</Text>
          {detail.distance > 0 && (
            <>
              <Text className="text-[#fff] font-pbold text-[48px] mx-4">{detail.distance}<Text className="text-[30px] text-[#838383]">км</Text></Text>
              <Text className="text-[#838383] font-pregular text-[20px] my-1 mx-4">за</Text></>
          )}
          <Text className="text-[#fff] font-pbold text-[48px] mx-4">{formatTime(detail.time)}</Text>
          <Text className="text-[#838383] font-pregular text-[20px] mt-1 mb-4 mx-4">через</Text>
          <View className="bg-primary w-min mb-10">
            <Text className="text-[#fff] font-pbold text-[48px] mx-4 mt-[-12px]">атлет</Text>
          </View>

          {detail.typ === 1 && (
            <View className="bg-[#111] mx-4 py-3 rounded-3xl">
              {detail.exercises.length > 0 && (
                <Text className="text-[#fff] font-pbold text-[20px] mx-4">упражнения:</Text>
              )}
              {detail.exercises.map((one, index) =>
                <View>
                  <Text className="text-[#fff] font-pregular text-[20px] mx-4 mt-1"><Text className="text-[#838383]">{index + 1}.</Text> {exercises[one].title}</Text>
                </View>
              )}
            </View>
          )}

          {detail.coordinates.length > 0 && (
            <View>
              <WebView
                ref={webRef}
                style={{ marginTop: -8, marginLeft: -8 }}
                originWhitelist={['*']}
                source={{ html: mapTemplate }}
                className="h-[100vw]"
                onLoadEnd={() => { setLoaded(true) }}
              />
            </View>
          )}
        </View>
      )}

      <View>
        <ScrollView
          className="h-full bg-[#000] pt-0"
          onScroll={handleScroll}
        >
          <View className="flex space-y-1">
            <View className="h-[54vw] w-full p-0 flex items-center">
              <Video
                source={background}
                className="w-full h-full mt-3 absolute top-0 m-0"
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={true}
              />

              <TouchableOpacity onPress={() => { router.push('/additional/notifications') }} className="absolute top-4 right-4 bg-[#00000060] p-2 rounded-full">
                <Image
                  source={icons.bell}
                  tintColor={'#fff'}
                  className="w-6 h-6"
                />
                {notificationsCount > 0 &&
                  (<View className="absolute bg-primary px-1 rounded-full right-[30px] top-0">
                    <Text className="font-pbold text-[#fff] text-[16px]">{notificationsCount}</Text>
                  </View>)
                }
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => { router.push('/bookmark') }} className="bg-[#fff] relative m-2 top-[45vw] w-[83%] pt-[15px] pb-[19px] rounded-[21px] z-30">
                <View className="flex flex-row items-center justify-center">
                  <Text className="text-center font-pregular text-[18px]">начать тренировку</Text>
                  <Image source={icons.play} tintColor={'#333'} className="w-[12px] h-[12px] ml-2 mb-[-4px]" />
                </View>
              </TouchableOpacity>
              <LinearGradient className="h-[18vw] relative top-[17vw] w-full z-10" colors={['#fff0', '#000']}></LinearGradient>
            </View>

            <View>
              <Text className="text-[16px] leading-[17px] mx-[16px] font-pregular relative text-[#838383] mt-[46px] text-center mb-1">атлет — первая версия</Text>
              <TouchableOpacity onPress={() => { router.push('/additional/calendar') }} className="flex flex-row justify-center items-center mb-3">
                <Text className="text-xl font-pbold relative text-[#fff] text-center mb-1">календарь</Text>
                <Image
                  className="w-[25px] h-[25px] ml-2"
                  source={icons.right}
                />
              </TouchableOpacity>
              <TouchableOpacity className="bg-[#111] mx-4 px-4 py-3 rounded-3xl">
                <View className="flex flex-row justify-between">
                  {week.map((day, index) => {
                    const today = new Date();
                    const dayOfWeek = today.getDay();
                    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Если сегодня воскресенье (0), смещаем на -6 дней
                    const mondayDate = new Date(today);
                    mondayDate.setDate(today.getDate() + mondayOffset);
                    const currentDate = mondayDate.getDate() + index;
                    return (
                      <View className="flex flex-row">
                        <View className="flex items-center">
                          <Text className={`font-pbold text-[19px] ${index === getCurrentWeekday() ? 'text-primary' : 'text-white'}`}>{day}</Text>

                          {calendar?.days?.length > 0 && Array.isArray(calendar.days[index]) && (
                            <>
                              {calendar.days[index].map((plan, planIndex) => (
                                <View key={planIndex}> {/* It's important to add a key for each element in a list */}
                                  <Image
                                    source={icons[plan.icon]}
                                    className="w-6 h-6 mt-2"
                                    tintColor={'#838383'}
                                  />
                                </View>
                              ))}
                            </>
                          )}

                          {plan.map((singlePlan, j) => (
                            new Date(singlePlan.date).getDate() === currentDate && (
                              <View
                                key={`single-${j}`}
                              >
                                <Image
                                  source={icons[singlePlan.icon]}
                                  className="w-6 h-6 mt-2"
                                  tintColor={'#838383'}
                                />
                              </View>
                            )
                          ))}

                          {calendar?.repeaten?.length > 0 && (
                            <>
                              {calendar.repeaten.map((r, repeatIndex) => (
                                <View key={repeatIndex}>
                                  {r.weekDays.includes(index) && (
                                    <Image
                                      source={icons[r.plan.icon]}
                                      className="w-6 h-6 mt-2"
                                      tintColor={'#838383'}
                                    />
                                  )}
                                </View>
                              ))}
                            </>
                          )}
                        </View>
                        {index !== 6 && (
                          <View className="bg-[#222] w-[2] rounded-xl ml-[13]"></View>
                        )}
                      </View>)
                  })}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-xl font-pbold relative text-[#fff] text-center mt-2">лента</Text>
          {combinedData.map(d => {
            if (d.from === 0) {
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (shareShown !== true && moreShown !== true) {
                      setDetail(d);
                      setDetailShown(true);
                      outerScrollViewRef.current.scrollTo({ y: width, animated: true });
                    }
                  }}
                  className="bg-[#111] py-3 rounded-3xl mx-4 mt-4">
                  <TouchableOpacity
                    className="bg-[#ffffff0f] w-8 h-8 absolute right-4 top-4 flex justify-center items-center rounded-xl z-[1]"
                    onPress={() => {
                      setMore(d);
                      setMoreShown(true);
                    }}
                  >
                    <Image
                      source={icons.dots}
                      className="w-6 h-6"
                      tintColor={'#838383'}
                    />
                  </TouchableOpacity>

                  {moreShown && more === d && (
                    <View className="w-[50vw] bg-[#222] absolute right-4 top-[20px] z-20 py-3 px-4 rounded-2xl">
                      <TouchableOpacity
                        onPress={() => {
                          setMoreShown(false);
                        }}
                      >
                        <Image
                          source={icons.close}
                          tintColor={'#838383'}
                          className="w-6 h-6 absolute right-0"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setMoreShown(false);
                          setShareShown(true);
                        }}
                        className="mt-6">
                        <Text className="text-white text-[18px] font-pregular">поделиться</Text>
                      </TouchableOpacity>
                      {more.typ === 1 && (<>
                        <View className="h-[2px] w-full bg-[#333] rounded-xl my-2"></View>

                        <TouchableOpacity
                          onPress={() => navigation.navigate('bookmark', { items: d?.exercises })}
                        >
                          <Text className="text-white text-[18px] font-pregular leading-[21px]">добавить эти упражнения в трекер</Text>
                        </TouchableOpacity></>
                      )}
                    </View>
                  )}

                  {shareShown && more === d && (
                    <View className="w-[70vw] bg-[#222] absolute right-4 top-[20px] z-20 py-3 px-4 rounded-2xl">
                      <View className="flex flex-row justify-between">
                        <Text className="text-white text-[18px] font-pregular">отправь другу</Text>

                        <TouchableOpacity
                          onPress={() => {
                            setMoreShown(false);
                            setShareShown(false);
                          }}
                        >
                          <Image
                            source={icons.close}
                            tintColor={'#838383'}
                            className="w-6 h-6"
                          />
                        </TouchableOpacity>
                      </View>

                      {friends.length > 0 ? (
                        <View>
                          <ScrollView
                            horizontal={true}
                          >
                            {friends?.map(friend =>
                              <TouchableOpacity
                                onPress={() => {
                                  const updatedFriends = friends.map(fr => {
                                    if (fr.userId === friend.userId) {
                                      return {
                                        ...fr,
                                        added: true,
                                      };
                                    }
                                    return fr; // Возвращаем объект без изменений
                                  });

                                  const removedFriends = friends.map(fr => {
                                    if (fr.userId === friend.userId) {
                                      return {
                                        ...fr,
                                        added: false,
                                      };
                                    }
                                    return fr; // Возвращаем объект без изменений
                                  });

                                  if (friend.added === true) {
                                    setFriends(removedFriends);
                                  } else {
                                    setFriends(updatedFriends);
                                  }
                                }}
                              >
                                <View className={`${friend.added && 'bg-white'} h-[56px] w-[56px] rounded-full mt-3 flex justify-center items-center mx-1`}>
                                  <Image
                                    source={{ uri: friend.imageUrl }}
                                    className={`h-[52px] w-[52px] rounded-full`}
                                  />
                                </View>
                                <Text className={`${friend.added ? 'text-[#fff]' : 'text-[#838383]'} text-[12px] font-pregular text-center`}>{friend.name.split(' ')[0]}</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>

                          <TouchableOpacity
                            onPress={() => {
                              const nfs = friends.filter(item => item.added).map(f => {
                                return {
                                  sentTo: f.userId,
                                  sentBy: 0,
                                  sentById: user.$id,
                                  title: `${types[d.typ].title} - тренировка`,
                                  contentId: d.$id,
                                  type: 5,
                                };
                              });

                              nfs.forEach(form => {
                                sendNotification(form);
                              });

                              setShareShown(false);
                              setMoreShown(false);
                            }}

                            className={`${friends.some(item => item.added) ? 'bg-white' : 'bg-[#333]'} py-2 rounded-2xl mt-4`}>
                            <Text className={`${friends.some(item => item.added) ? 'text-black' : 'text-[#838383]'} text-center text-[18px] font-pregular`}>отправить</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text className="text-[#838383] text-[18px] font-pregular">ты пока никого не добавил :(</Text>
                      )}
                    </View>
                  )}

                  <View className="flex flex-row mx-4">
                    {d.imageUrl ? (
                      <Image
                        source={{ uri: d.imageUrl }}
                        className="w-[52px] h-[52px] rounded-xl mr-3"
                      />
                    ) : (
                      <Image
                        source={icons.avatar}
                        className="w-[52px] h-[52px] rounded-xl mr-3"
                      />
                    )}
                    <View className="flex flex-col">
                      <Text className="text-white mr-4 text-[19px] font-pbold">{d.name}</Text>
                      <Text className="text-[#838383] mr-4 text-[17px] font-pregular">{types[d.typ]?.title}, {formatDate(d.$createdAt)}</Text>
                    </View>
                  </View>

                  {d.description?.length > 0 && (
                    <Text className="text-[#838383] mx-4 text-[17px] mt-4 font-pregular">{d.description}</Text>
                  )}

                  <View className="mx-4 h-[2px] bg-[#222] rounded-xl mt-4 mb-3"></View>

                  <View className="flex flex-row justify-between mx-4">
                    <View className="">
                      <Text className="font-pregular text-[#838383] text-[17px]">время</Text>
                      <Text className="font-pregular text-[#fff] text-[17px]">{formatTime(d.time)}</Text>
                    </View>

                    {d.distance > 0 && (
                      <View>
                        <Text className="font-pregular text-[#838383] text-[17px]">темп</Text>
                        <Text className="font-pregular text-[#fff] text-[17px]">{calculatePace(d.time, d.distance)}/км</Text>
                      </View>
                    )}

                    {d.distance > 0 && (
                      <View>
                        <Text className="font-pregular text-[#838383] text-[17px]">дистанция</Text>
                        <Text className="font-pregular text-[#fff] text-[17px]">{d.distance}км</Text>
                      </View>
                    )}

                    {d.exercises.length > 0 && (
                      <View>
                        <Text className="font-pregular text-[#838383] text-[17px]">упражнений</Text>
                        <Text className="font-pregular text-[#fff] text-[17px]">{d.exercises.length}</Text>
                      </View>
                    )}
                  </View>

                  {//<View className="mx-4 h-[2px] bg-[#222] rounded-xl mt-4 mb-3"></View>
                  }

                  {d.typ === 0 && (
                    <View className="mt-4">
                      {d.coordinates.length > 1 && (
                        <><View className="flex flex-row justify-between">
                          <View>
                            <Text className="font-pregular text-[#838383] text-[17px] mx-4">скорость</Text>
                            <Text className="text-white mx-4 text-[17px] font-pregular">{(d.distance / d.time * 3600).toFixed(1)}км/ч</Text>
                            <Text className="font-pregular text-[#838383] text-[17px] mx-4 mt-4">сложность</Text>
                            <Text className="text-white mx-4 text-[17px] font-pregular">{d.effort ? d.effort : '--'}/10</Text>
                          </View>
                          <View>
                            <Text className="font-pregular text-[#838383] text-[17px] mx-4">активность</Text>
                            <Text className="text-white mx-4 text-[17px] font-pregular">+{(d.time / 30).toFixed()}</Text>
                            <Text className="font-pregular text-[#838383] text-[17px] mx-4 mt-4">сжёг</Text>
                            <Text className="text-white mx-4 text-[17px] font-pregular">{((d.distance / d.time * 3600) * d.distance * 12).toFixed()}ккал</Text>
                          </View>

                          <View style={{ width: 90, height: 90 }}
                            className="mt-4 mx-4 mb-2 "
                          >
                            <Graph coordinates={d.coordinates} />
                          </View>
                        </View>
                          {//<View className="w-full h-[200px]">
                            // <WebView
                            // ref={webRef}
                            //style={{ marginTop: -8, marginLeft: -8 }}
                            //  originWhitelist={['*']}
                            //source={{ html: mapTemplate }} />
                            //</View>
                          }
                        </>
                      )}
                    </View>
                  )}


                  {d.exercises.length > 0 && (
                    <>

                      <Text className="text-[#838383] font-pregular mx-4 text-[17px]">упражнения</Text>

                      {d.exercises.length > 5 ? (
                        <>
                          {d.exercises.slice(0, 5).map((exe, index) => (
                            <Text className="text-white font-pregular mx-4 mt-1 text-[17px]" key={exe}><Text className="text-[#838383]">{index + 1}.</Text> {exercises[exe].title}</Text>
                          ))}
                          <Text className="text-[#838383] font-pregular mx-4 mt-1 text-[17px]">показать все...</Text>
                        </>
                      ) : (<>
                        {d.exercises.map((exe, index) => (
                          <Text className="text-white font-pregular mx-4 mt-1 text-[17px]" key={exe}><Text className="text-[#838383]">{index + 1}.</Text> {exercises[exe].title}</Text>
                        ))}</>
                      )}
                    </>
                  )}

                </TouchableOpacity>
              );
            }

            else if (d.from === 1) {
              return (
                <TouchableOpacity className="bg-[#111] py-3 rounded-3xl mx-4 mt-4">
                  <TouchableOpacity
                    className="bg-[#ffffff0f] w-8 h-8 absolute right-4 top-4 flex justify-center items-center rounded-xl"
                    onPress={() => {
                      setMore(d);
                      setMoreShown(true);
                    }}
                  >
                    <Image
                      source={icons.dots}
                      className="w-6 h-6"
                      tintColor={'#838383'}
                    />
                  </TouchableOpacity>

                  {moreShown && more === d && (
                    <View className="w-[50vw] bg-[#222] absolute right-4 top-[20px] z-20 py-3 px-4 rounded-2xl">
                      <TouchableOpacity
                        onPress={() => {
                          setMoreShown(false);
                        }}
                      >
                        <Image
                          source={icons.close}
                          tintColor={'#838383'}
                          className="w-6 h-6 absolute right-0"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setMoreShown(false);
                          setShareShown(true);
                        }}
                        className="mt-6">
                        <Text className="text-white text-[18px] font-pregular">поделиться</Text>
                      </TouchableOpacity>
                      {more.typ === 1 && (<>
                        <View className="h-[2px] w-full bg-[#333] rounded-xl my-2"></View>

                        <TouchableOpacity
                          onPress={() => navigation.navigate('bookmark', { items: d?.exercises })}
                        >
                          <Text className="text-white text-[18px] font-pregular leading-[21px]">добавить эти упражнения в трекер</Text>
                        </TouchableOpacity></>
                      )}
                    </View>
                  )}

                  {shareShown && more === d && (
                    <View className="w-[70vw] bg-[#222] absolute right-4 top-[20px] z-20 py-3 px-4 rounded-2xl">
                      <View className="flex flex-row justify-between">
                        <Text className="text-white text-[18px] font-pregular">отправь другу</Text>

                        <TouchableOpacity
                          onPress={() => {
                            setMoreShown(false);
                            setShareShown(false);
                          }}
                        >
                          <Image
                            source={icons.close}
                            tintColor={'#838383'}
                            className="w-6 h-6"
                          />
                        </TouchableOpacity>
                      </View>
                      {friends.length > 0 ? (
                        <View>
                          <ScrollView
                            horizontal={true}
                          >
                            {friends?.map(friend =>
                              <TouchableOpacity
                                onPress={() => {
                                  const updatedFriends = friends.map(fr => {
                                    if (fr.userId === friend.userId) {
                                      return {
                                        ...fr,
                                        added: true,
                                      };
                                    }
                                    return fr; // Возвращаем объект без изменений
                                  });

                                  const removedFriends = friends.map(fr => {
                                    if (fr.userId === friend.userId) {
                                      return {
                                        ...fr,
                                        added: false,
                                      };
                                    }
                                    return fr; // Возвращаем объект без изменений
                                  });

                                  if (friend.added === true) {
                                    setFriends(removedFriends);
                                  } else {
                                    setFriends(updatedFriends);
                                  }
                                }}
                              >
                                <View className={`${friend.added && 'bg-white'} h-[56px] w-[56px] rounded-full mt-3 flex justify-center items-center mx-1`}>
                                  <Image
                                    source={{ uri: friend.imageUrl }}
                                    className={`h-[52px] w-[52px] rounded-full`}
                                  />
                                </View>
                                <Text className={`${friend.added ? 'text-[#fff]' : 'text-[#838383]'} text-[12px] font-pregular text-center`}>{friend.name.split(' ')[0]}</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>

                          <TouchableOpacity
                            onPress={() => {
                              const nfs = friends.filter(item => item.added).map(f => {
                                return {
                                  sentTo: f.userId,
                                  sentBy: 0,
                                  sentById: user.$id,
                                  title: `${types[tr.typ].title} - тренировка`,
                                  contentId: tr.$id,
                                  type: 5,
                                };
                              });

                              nfs.forEach(form => {
                                sendNotification(form);
                              });

                              setShareShown(false);
                              setMoreShown(false);
                            }}

                            className={`${friends.some(item => item.added) ? 'bg-white' : 'bg-[#333]'} py-2 rounded-2xl mt-4`}>
                            <Text className={`${friends.some(item => item.added) ? 'text-black' : 'text-[#838383]'} text-center text-[18px] font-pregular`}>отправить</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text className="text-[#838383] text-[18px] font-pregular">ты пока никого не добавил :(</Text>
                      )}
                    </View>
                  )}

                  <View className="flex flex-row mx-4">
                    <Image
                      source={{ uri: d.imageUrl }}
                      className="w-[52px] h-[52px] rounded-xl mr-3"
                    />
                    <View className="flex flex-col">
                      <Text className="text-white mr-4 text-[19px] font-pbold">{d.name}</Text>
                      <Text className="text-[#838383] mr-4 text-[17px] font-pregular">{formatDate(d.$createdAt)}</Text>
                    </View>
                  </View>

                  <Text className="text-[#fff] mx-4 text-[17px] mt-4 font-pregular">{d.caption}</Text>
                </TouchableOpacity>
              )
            }

            else if (d.from === 2) {
              return (
                <TouchableOpacity className="bg-[#111] py-3 rounded-3xl mx-4 mt-4">
                  {moreShown && more === d && (
                    <View className="w-[50vw] bg-[#222] absolute right-4 top-[20px] z-20 py-3 px-4 rounded-2xl">
                      <TouchableOpacity
                        onPress={() => {
                          setMoreShown(false);
                        }}
                      >
                        <Image
                          source={icons.close}
                          tintColor={'#838383'}
                          className="w-6 h-6 absolute right-0"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setMoreShown(false);
                          setShareShown(true);
                        }}
                        className="mt-6">
                        <Text className="text-white text-[18px] font-pregular">поделиться</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {shareShown && more === d && (
                    <View className="w-[70vw] bg-[#222] absolute right-4 top-[20px] z-20 py-3 px-4 rounded-2xl">
                      <View className="flex flex-row justify-between">
                        <Text className="text-white text-[18px] font-pregular">отправь другу</Text>

                        <TouchableOpacity
                          onPress={() => {
                            setMoreShown(false);
                            setShareShown(false);
                          }}
                        >
                          <Image
                            source={icons.close}
                            tintColor={'#838383'}
                            className="w-6 h-6"
                          />
                        </TouchableOpacity>
                      </View>
                      {friends.length > 0 ? (
                        <View>
                          <ScrollView
                            horizontal={true}
                          >
                            {friends?.map(friend =>
                              <TouchableOpacity
                                onPress={() => {
                                  const updatedFriends = friends.map(fr => {
                                    if (fr.userId === friend.userId) {
                                      return {
                                        ...fr,
                                        added: true,
                                      };
                                    }
                                    return fr; // Возвращаем объект без изменений
                                  });

                                  const removedFriends = friends.map(fr => {
                                    if (fr.userId === friend.userId) {
                                      return {
                                        ...fr,
                                        added: false,
                                      };
                                    }
                                    return fr; // Возвращаем объект без изменений
                                  });

                                  if (friend.added === true) {
                                    setFriends(removedFriends);
                                  } else {
                                    setFriends(updatedFriends);
                                  }
                                }}
                              >
                                <View className={`${friend.added && 'bg-white'} h-[56px] w-[56px] rounded-full mt-3 flex justify-center items-center mx-1`}>
                                  <Image
                                    source={{ uri: friend.imageUrl }}
                                    className={`h-[52px] w-[52px] rounded-full`}
                                  />
                                </View>
                                <Text className={`${friend.added ? 'text-[#fff]' : 'text-[#838383]'} text-[12px] font-pregular text-center`}>{friend.name.split(' ')[0]}</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>

                          <TouchableOpacity
                            onPress={() => {
                              const nfs = friends.filter(item => item.added).map(f => {
                                return {
                                  sentTo: f.userId,
                                  sentBy: 0,
                                  sentById: user.$id,
                                  title: `${types[tr.typ].title} - тренировка`,
                                  contentId: tr.$id,
                                  type: 5,
                                };
                              });

                              nfs.forEach(form => {
                                sendNotification(form);
                              });

                              setShareShown(false);
                              setMoreShown(false);
                            }}

                            className={`${friends.some(item => item.added) ? 'bg-white' : 'bg-[#333]'} py-2 rounded-2xl mt-4`}>
                            <Text className={`${friends.some(item => item.added) ? 'text-black' : 'text-[#838383]'} text-center text-[18px] font-pregular`}>отправить</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text className="text-[#838383] text-[18px] font-pregular">ты пока никого не добавил :(</Text>
                      )}
                    </View>
                  )}


                  <TouchableOpacity
                    className="bg-[#ffffff0f] w-8 h-8 absolute right-4 top-4 flex justify-center items-center rounded-xl"
                    onPress={() => {
                      setMore(d);
                      setMoreShown(true);
                    }}
                  >
                    <Image
                      source={icons.dots}
                      className="w-6 h-6"
                      tintColor={'#838383'}
                    />
                  </TouchableOpacity>

                  <View className="flex flex-row mx-4">
                    <Image
                      source={{ uri: d.imageUrl }}
                      className="w-[52px] h-[52px] rounded-xl mr-3"
                    />
                    <View className="flex flex-col items-start">
                      <View className="flex flex-row">
                        <Text className="text-white mr-2 text-[19px] font-pbold">{d.name}</Text>
                        {d.verif && (
                          <Image
                            source={icons.verify}
                            className="w-5 h-5 mt-1"
                          />)}
                      </View>
                      <Text className="text-[#838383] mr-4 text-[17px] font-pregular">{formatDate(d.$createdAt)}</Text>
                    </View>
                  </View>

                  <Text className="text-[#fff] mx-4 mt-4 text-[17px] font-pregular">{d.content}</Text>
                </TouchableOpacity>
              )
            }
          })}

          {combinedData.length === 0 && (
            <View>
              <ActivityIndicator
                animating={true}
                color="#fff"
                size={50}
                className="mt-4"
              />
            </View>
          )}

          {combinedData.length > 0 && (
            <View>
              <Text className="text-white mx-4 mt-10 text-[19px] font-pbold">вот лента и закончилась :({`\n`}<Text className="text-primary" onPress={() => { router.push('/bookmark') }}>запиши</Text> тренировку и она появится здесь</Text>
            </View>
          )}
          <View
            className="mt-[70vh]"
          ></View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default Home;
