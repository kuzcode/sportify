import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, Dimensions, Image, StyleSheet, Vibration } from "react-native";
import { ResizeMode, Video } from "expo-av";
import background from "../../assets/video.mp4"

import { useState, useRef, useEffect } from "react";

import { useGlobalContext } from "../../context/GlobalProvider";
import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getAllQuotes, getUserTrainings, getUserTrackers, getAllUsers, getUserMeal, likeQuote, getAllCommunities, getUserCalendar, getUserNotifications, getHot, getUserById, getCommunityById } from "../../lib/appwrite";
import { types } from "../../constants/types";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { colors, meal } from "../../constants/types";
import moment from 'moment';

const CurrentDate = moment().date(); // Получаем текущее число
const daysInMonth = moment().daysInMonth(); // Получаем количество дней в текущем месяце

const Home = () => {
  const { width } = Dimensions.get("window");
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const { data: trainings, loading: trainingsLoading } = useAppwrite(() => getUserTrainings(user?.$id));
  const { data: trackers, loading: trackersLoading } = useAppwrite(() => getUserTrackers(user?.$id));
  const { data: users } = useAppwrite(getAllUsers);

  const [mealForm, setMealForm] = useState({});
  const [communities, setCommunities] = useState([])

  const [recsShown, setRecsShown] = useState(false);
  const [alShown, setAlShown] = useState(false);
  const [current, setCurrent] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [openedFrom, setOpenedFrom] = useState(0);
  const [calendar, setCalendar] = useState({});
  const [notifications, setNotifications] = useState([])
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [hot, setHot] = useState([])

  const hanScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(yOffset);
  };

  useEffect(() => {
    const fetchCommunities = async () => {
      const data = await getAllCommunities();
      setCommunities(data);
    };

    fetchCommunities();
  }, []);


  useEffect(() => {
    const fetchHot = async () => {
      const data = await getHot();

      const enrichedData = await Promise.all(data.map(async (item) => {
        if (item.creatorType === 0) {
          const userr = await getUserById(item.creator);
          console.log('userr: ', userr.documents[0].name)
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

    console.log('hot: ', hot)
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
    fetchMealData();
  }, []);

  console.log('mealForm:', mealForm)

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
        const quotes = await getAllQuotes(user?.$id);
        setMotivation(quotes);

        motivation.map(a => {
          if (a.isLikedByUser == true) {
            setLikedQuotes(
              [...likedQuotes, a.id]
            );
          }
        })
      } catch (err) {
      }
    };

    if (user) {
      fetchQuotes();
    }
  }, [user]);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await getUserCalendar(user.$id);
        setCalendar(res[0]);
        console.log('calendar: ', calendar)
      } catch (err) {
      }
    };

    fetchCalendar();
  }, [user]);


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

  return (
    <ScrollView
      ref={outerScrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={50} // Обновляем событие прокрутки каждые 50 мс
      contentOffset={{ y: width, x: 0 }}
      snapToInterval={width}
      decelerationRate="fast"
    >
      <View className="bg-[#f3f7f8] h-[100vw] w-[100vw]">
        <Text className="font-pregular text-[16px] mt-8 mx-10 text-center">квадрат мотивации</Text>

        {motivation.length == 0 && (
          <Text className="text-[19px] font-pbold text-center mt-[60px]">какая-то проблема :(</Text>
        )}

        <ScrollView
          horizontal={true}
          snapToInterval={width}
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
      <ScrollView
        className="h-full bg-[#000] pt-0"
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
            <Text className="text-[16px] leading-[17px] mx-[16px] font-pregular relative text-[#838383] mt-[40px] text-center mb-4">здравствуй, чемпион! время идти на тренировку, всё, что не убивает, делает нас сильнее</Text>

            <TouchableOpacity onPress={() => { router.push('/additional/calendar') }} className="flex flex-row justify-center items-center mb-3">
              <Text className="text-xl font-pbold relative text-[#fff] text-center mb-1">календарь</Text>
              <Image
                className="w-[25px] h-[25px] ml-2"
                source={icons.right}
              />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#111] mx-4 px-4 py-3 rounded-3xl">
              <View className="flex flex-row justify-between">
                {week.map((day, index) =>
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
                  </View>
                )}
              </View>
            </TouchableOpacity>



            <TouchableOpacity onPress={() => { router.push('/additional/trackers') }} className="flex flex-row justify-center items-center my-4">
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
                  content = { a: `воздержание ${track.name}`, b: `${track.done}/${track.goal} дней` };
                } else if (track.type === 2) {
                  content = { a: `пить воду ${track.name}`, b: `${track.done}/${track.goal} мл` };
                }
                else if (track.type === 3) {
                  content = { a: `каждый день ${track.name}`, b: `${track.done}/${track.goal} дней` };
                }
                else {
                  content = { a: `${track.name}`, b: '' }; // Handle unknown types gracefully
                }


                return (
                  <TouchableOpacity
                    key={track}
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

              <TouchableOpacity className="pr-4" onPress={() => { router.push('/additional/newTrack') }}>
                <View className="relative w-[90vw] mr-[3vw] h-[165px] bg-[#0b0b0b] px-4 py-2 rounded-3xl overflow-hidden mb-4">
                  <Text className="text-[#838383] text-center font-pbold m-0 bg-[#131313] rounded-full mx-auto w-[64px] mt-[24px] h-[64px] text-[40px]">+</Text>
                  <Text className="text-[#838383] text-center font-pregular text-[15px] mt-[8px]">создать трекер привычки</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        <Text className="text-xl font-pbold relative text-[#fff] text-center mt-2">топ публикаций</Text>
        {hot
          .sort((a, b) => b.indexShown - a.indexShown) // Cортируем по убыванию значения index
          .map(item => {
            return (
              <TouchableOpacity
                key={item.$id}
                className="bg-[#111] pb-3 rounded-3xl mx-4 mt-4"
              >
                <View className="flex flex-row items-center">
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-[50px] h-[50px] mr-2s rounded-tl-3xl rounded-br-lg"
                  />
                  <Text className="text-white text-[20px] font-pbold mx-4">{item.name}</Text>
                </View>
                <Text className="text-white text-[20px] font-pbold mx-4">{item.title}</Text>
                <Text className="text-white text-[18px] font-pregular mx-4">{item.caption}</Text>
              </TouchableOpacity>
            )
          })}

        {recsShown && (
          <View className="bg-black w-[100vw] h-full top-0 z-10">
            <TouchableOpacity className="absolute right-[16px] top-0" onPress={() => {
              setRecsShown(false);
              outerScrollViewRef.current.scrollTo({ y: openedFrom, animated: true });
            }}>
              <Image
                source={icons.close}
                className="w-8 h-8 top-8 right-0 mr-4 z-10 "
                tintColor={'white'}
              />
            </TouchableOpacity>
            <Image
              source={{ uri: current.imageUrl }}
              className="w-[150] h-[150] rounded-full mx-auto mt-[8vh]"
            />
            <View className="flex flex-row justify-center mt-2">
              <Text className="text-white font-pbold text-[25px] ml-4 mr-2">{current.name}</Text>
              {current.isVerif && (
                <Image
                  source={icons.verify}
                  className="w-7 h-7 mt-[6]"
                />
              )}
            </View>

            <View className="flex flex-row justify-center">
              <Text className="text-[#838383] font-pregular text-[20px] mt-0 mr-1">сообщество, {communities.find(rec => rec.$id === current.$id).users.length}</Text>
              <Image
                source={icons.profile}
                className="h-5 w-5 mt-1"
                tintColor={'#838383'}
              />
            </View>

            {communities.find(rec => rec.$id === current.$id).users.includes(user.$id) ? (
              <TouchableOpacity onPress={() => { setAlShown(true) }} className="bg-[#111] py-3 rounded-2xl mx-4 mt-4">
                <Text className="text-[18px] text-white font-pregular text-center">покинуть</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => {
                joinCommunity(current.$id, user.$id)
                toggleUser(current.$id);
              }} className="bg-white py-3 rounded-2xl mt-4 mx-4">
                <Text className="text-[20px] text-black font-pregular text-center">вступить</Text>
              </TouchableOpacity>
            )}

            <Text className="text-white font-pbold text-[25px] mx-4 mt-4">лента</Text>
            {
              current.content.map(a => {
                if (a.type === 0) {
                  return (
                    <View
                      key={a}
                      onPress={() => { }}
                      className="relative mt-4 mr-[3vw] h-[165px] mx-4 bg-[#111] rounded-3xl overflow-hidden mb-4"
                    >
                      <Text className="text-white text-[18px] font-pregular mx-4 my-2">{a.content}</Text>
                    </View>
                  )
                }
                else if (a.type === 1) {
                  return (
                    <View
                      key={a}
                      onPress={() => { }}
                      className="relative mt-4 mr-[3vw] h-[165px] mx-4 bg-[#111] rounded-3xl overflow-hidden mb-4"
                    >
                      <Text className="text-white text-[18px] font-pregular mx-4 my-2">{a.content}</Text>
                    </View>
                  )
                }
              })
            }
          </View>
        )}

        {communities.length > 0 && (
          communities.map(item => (
            <TouchableOpacity activeOpacity={1} className="bg-black" onPress={() => {
              setCurrent(item);
              setRecsShown(true);
              outerScrollViewRef.current.scrollTo({ y: 400, animated: true });
            }} key={item.id}>
              <View className="flex flex-row justify-center items-center mb-4 mt-4">
                <Image
                  className="w-[25px] h-[25px] mr-2 rounded-full"
                  source={{ uri: item.imageUrl }}
                />
                <Text className="text-xl font-pbold relative text-[#fff] text-center">{item.name}</Text>
                <Image
                  className="w-[25px] h-[25px] ml-2"
                  source={icons.right}
                />
              </View>

              <ScrollView horizontal={true}
                snapToInterval={(width * 0.9225)}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                className="relative w-[100vw] h-[165px] rounded-3xl mb-2 pl-4">
                {item.content.map(a => {
                  if (a.type === 0) {
                    return (
                      <View
                        key={a}
                        onPress={() => { }}
                        className="relative w-[90vw] mr-[3vw] h-[165px] bg-[#161616] rounded-3xl overflow-hidden mb-4"
                      >
                        <Text className="text-white text-[18px] font-pregular mx-4 my-2">{a.content}</Text>
                      </View>
                    )
                  }
                  else if (a.type === 1) {
                    return (
                      <View
                        key={a}
                        onPress={() => { }}
                        className="relative w-[90vw] mr-[3vw] h-[165px] bg-[#161616] rounded-3xl overflow-hidden mb-4"
                      >
                        <Text className="text-white text-[18px] font-pregular mx-4 my-2">{a.content}</Text>
                      </View>
                    )
                  }
                }
                )}
              </ScrollView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScrollView>
  );
};

export default Home;
