import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl, TextInput, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import useAppwrite from "../../lib/useAppwrite";
import { getUserCompleted, getWeeklyReport, getUserById, updateWeekly, getAwards, getUserAwards, getUserFriends, getAwardsByIds, createPost, getUserPosts, deletePost } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { rank, types } from "../../constants/types";
import { icons } from "../../constants";
import { LineChart } from 'react-native-chart-kit';
import { exercises } from "../../constants/exercises";
import { FormField } from "../../components";
import WebView from 'react-native-webview';
import mapTemplate from '../map-template';

const Profile = () => {
  const router = useRouter();
  const global = useGlobalContext();
  const [user, setUser] = useState(global.user);
  const [completed, setCompleted] = useState([]);
  const [tab, setTab] = useState(0);
  const [awards, setAwards] = useState([]);
  const [posts, setPosts] = useState([]);
  const [combinedList, setCombinedList] = useState([]);
  const [friends, setFriends] = useState([]);
  const [userAwards, setUserAwards] = useState([]);
  const [caption, setCaption] = useState('');
  const [tosave, setTosave] = useState(0);
  const [detail, setDetail] = useState({});
  const [detailShown, setDetailShown] = useState(false);
  const [postShown, setPostShown] = useState(false);
  const [post, setPost] = useState({});
  const ref = useRef(null);

  const [weekly, setWeekly] = useState({
    weight: [
      {
        val: 0,
      }
    ]
  });

  const webRef = useRef(null);

  useEffect(() => {
    async function fetchWeeklyReport() {
      try {
        const gotWeekly = await getWeeklyReport({
          userId: user?.$id
        });
        console.log('gotweekly: ', gotWeekly);

        // Проверяем наличие объектов в weight
        if (gotWeekly?.weight?.length > 0) {
          // Фильтруем массив weight, оставляя только объекты с val больше 20
          const filteredWeights = gotWeekly.weight.filter(weightItem => weightItem.val > 20);

          if (filteredWeights.length > 0) {
            setWeekly({ weight: filteredWeights });
            setTosave(filteredWeights[filteredWeights.length - 1].val);
          } else {
            setTosave(0);
            setWeekly({
              weight: [{ val: 0 }]
            });
          }
        } else {
          // Если в weight нет объектов, устанавливаем начальное значение
          setTosave(0);
          setWeekly({
            weight: [{ val: 0 }]
          });
        }
      } catch (error) {
        console.error('Error fetching weekly report: ', error);
      }
    }

    fetchWeeklyReport();
  }, [user]);

  useEffect(() => {
    async function fetchAwards() {
      try {
        const got = await getAwards();
        setAwards(got)
      } catch (error) {
        console.error('Error fetching awards: ', error);
      }
    }

    fetchAwards();
  }, [user])

  useEffect(() => {
    async function fetchUserAwards() {
      try {
        const got = await getUserAwards(user.$id);
        const awardsIds = got[0].awards; // Предполагаем, что 'awards' это массив ID наград
        // Теперь получаем награды по их ID
        const awardsData = await getAwardsByIds(awardsIds);

        // Объединяем данные наград с полученными данными по ID
        const awardsWithDetails = awardsData.map(award => {
          return {
            ...award, // добавляем поля из award
            name: award.name,
            price: award.imageUrl
          };
        });

        setUserAwards(awardsWithDetails);
      } catch (error) {
        console.error('Error fetching user awards: ', error);
      }
    }

    fetchUserAwards();
  }, [user]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const got = await getUserPosts(user.$id);
        setPosts(got);
      } catch (error) {
        console.error('Error fetching user posts: ', error);
      }
    };

    fetchUserPosts();
  }, [user]);

  useEffect(() => {
    const fetchCompletedDocuments = async () => {
      try {
        const completedData = await getUserCompleted(user.$id);
        setCompleted(completedData);
      } catch (error) {
        console.error('Error fetching completed documents:', error);
      }
    };

    fetchCompletedDocuments();
  }, [user.$id]);

  useEffect(() => {
    const combined = [...posts, ...completed];
    combined.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    setCombinedList(combined);
  }, [posts, completed]);


  useEffect(() => {
    async function fetchFriends() {
      try {
        const got = await getUserFriends(user.$id);
        setFriends(got[0].friends)
      } catch (error) {
        console.error('Error fetching user friends: ', error);
      }
    }

    fetchFriends();
    console.log(friends.length)
  }, [user])

  const [trainings, setTrainings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState(null);

  const handleSelectDays = (days) => {
    setSelectedDays(days);
    setModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const reloadedUser = await getUserById(user.$id);
    setUser(reloadedUser.documents[0])
    const completedData = await getUserCompleted(user.$id);
    setCompleted(completedData); // Устанавливаем данные в состояние
    setRefreshing(false);
  };

  const metrics = {
    weight: 74,
    height: 186,
  }

  const calculateTotalTime = () => {
    return completed.reduce((total, item) => {
      return total + item.time;
    }, 0);
  };

  const styles = StyleSheet.create({
    text: {
      fontSize: 24,
      marginBottom: 10,
    },
    outerBlock: {
      height: 30,
      backgroundColor: '#00000010',
      borderRadius: 10,
      overflow: 'hidden',
    },
    innerBlock: {
      height: '100%',
      backgroundColor: '#fff',
    }
  });

  const getFriendsText = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return `${count} друг`;
    } else if ((count % 10 >= 2 && count % 10 <= 4) && (count % 100 < 12 || count % 100 > 14)) {
      return `${count} друга`;
    } else {
      return `${count} друзей`;
    }
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


  const [weight, setWeight] = useState([70]); // Ваш список чисел

  const [form, setForm] = useState({
    weightList: [{ val: 0 }],
    weight: 0
  })

  useEffect(() => {
    setForm({
      weightList: weekly.weight,
      weight: weekly.weight[weekly.weight.length - 1]?.val,
      height: metrics.height,
      changes: {
        weight: (weekly.weight[weekly.weight.length - 1]?.val - weekly.weight[0]?.val).toFixed(1),
        height: (weight[(weight.length - 1)] - weight[0]).toFixed(1),
      }
    })
  }, [weekly])

  useEffect(() => {
    if (completed[0]) {
      setTrainings(completed)
    }
  }, [completed]);

  const [alShown, setAlShown] = useState(false);


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


  useEffect(() => {
    const formattedRoutes = detail?.coordinates?.map(coord => [coord.x, coord.y]);
    webRef?.current?.injectJavaScript(`flyToUserLocation({"latitude": ${detail?.coordinates[0]?.x}, "longitude": ${detail?.coordinates[0]?.y}});`);
    webRef?.current?.injectJavaScript(`drawRoutes([${JSON.stringify(formattedRoutes)}]);`);
  }, [detail])

  const formatTime = time => {
    const hours = String(Math.floor(time / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getRoundedNumbers = (weight) => {
    const min = Math.floor(Math.min(...weight) / 10) * 10;
    const max = Math.ceil(Math.max(...weight) / 10) * 10;
    const numbers = [];

    for (let i = min; i <= max; i += 5) {
      numbers.push(i);
    }

    return numbers;
  };

  const roundedNumbers = getRoundedNumbers(weight);

  const settings = () => {
    router.push("/additional/settings");
  };

  const percentage = (user?.exp / rank[(user?.rank - 1)]?.exp) * 100; // Значение от 1 до 100
  const blockWidth = percentage + '%';

  const filteredList = types.filter(item => user?.sports?.includes(item.key));

  return (
    <ScrollView className="bg-[#000] h-full"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      ref={ref}
    >
      {postShown && (
        <View className="bg-black w-[100vw] h-full fixed top-0 z-10">
          {alShown && (
            <View className="bg-[#222] absolute z-20 top-[30vh] left-4 right-4 px-4 py-3 rounded-3xl">
              <Text className="text-white text-[20px] font-pbold">ты уверен, что хочешь удалить запись?</Text>
              <Text className="text-[#838383] text-[18px] font-pregular">её больше никто не увидит</Text>
              <TouchableOpacity onPress={() => { setAlShown(false) }} className="bg-[#333] py-2 rounded-2xl mt-2">
                <Text className="text-center text-[19px] font-pregular text-white">оставить</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                deletePost(post.$id);
                setAlShown(false);
                setPostShown(false);
                onRefresh();
              }} className="bg-[#fff] py-2 rounded-2xl mt-3">
                <Text className="text-center text-[19px] font-pregular">удалить</Text>
              </TouchableOpacity>
            </View>
          )}


          <TouchableOpacity className="absolute right-[16px] top-0 z-20" onPress={() => { setPostShown(false) }}>
            <Image
              source={icons.close}
              className="w-8 h-8 top-8 right-0 mr-4 z-10"
              tintColor={'white'}
            />
          </TouchableOpacity>

          <View
            className="bg-[#111] mx-4 py-3 rounded-3xl px-4 mt-[12vh]">
            <View className="flex flex-row">
              <Image
                source={{ uri: user.imageUrl }}
                className="w-[52px] h-[52px] rounded-xl mr-3"
              />
              <View className="flex flex-col">
                <Text className="text-white mr-4 text-[19px] font-pbold">{user.name}</Text>
                <Text className="text-[#838383] mr-4 text-[17px] font-pregular">{formatDate(post.$createdAt)}</Text>
              </View>
            </View>

            <View className="h-[2px] bg-[#222] rounded-xl my-4"></View>
            <Text className="text-[18px] font-pregular text-white">{post.caption}</Text>
          </View>

          <TouchableOpacity className="bg-[#240a0a] mt-4 mx-4 pt-2 pb-3 px-4 rounded-2xl"
            onPress={() => { setAlShown(true) }}
          >
            <Text className="text-[#FF7E7E] font-pregular text-[18px] text-center">удалить запись</Text>
          </TouchableOpacity>
        </View>
      )}

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

          {detail.coordinates.length > 0 && (
            <View>
              <WebView
                ref={webRef}
                style={{ marginTop: -8, marginLeft: -8 }}
                originWhitelist={['*']}
                source={{ html: mapTemplate }}
                className="h-[100vw]"
              />
            </View>
          )}

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
        </View>
      )}

      <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
        <View className="flex flex-row justify-between mb-10 w-full">
          <TouchableOpacity className="bg-primary py-[2] px-4 rounded-xl">
            {user.balance ? (
              <View>
                <Text className="text-white font-pregular text-[15px] m-0">баланс</Text>
                <Text className="text-white font-pbold text-[18px] m-0">{user.balance}</Text>
              </View>
            ) : (
              <Text className="text-white font-pbold text-[18px] m-0">0</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={settings} className="">
            <Image source={icons.settings} tintColor={'#838383'} resizeMode="contain" className="w-6 h-6" />
          </TouchableOpacity>
        </View>


        {user.imageUrl ? (
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-[40vw] h-[40vw] rounded-3xl bg-[#111] mb-2"
            resizeMode="cover"
          />
        ) : (
          <Image
            source={icons.avatar}
            className="w-[40vw] h-[40vw] rounded-3xl bg-[#111] mb-2"
          />
        )}

        <View className="flex flex-row">
          <Text className="text-[24px] font-pbold text-white">{user.name}</Text>
        </View>
        <Text className="text-lg font-psemibold text-[#838383]">@{user.username}</Text>
        {user.bio.length > 0 && (
          <Text className="text-lg font-pregular text-[#838383]">{user.bio}</Text>
        )}
      </View>

      <View className="flex flex-row mx-4 mb-4">
        <TouchableOpacity
          className=""
          onPress={() => { setTab(0) }}
        >
          <Text className={`${tab === 0 ? `text-white` : `text-[#838383]`} text-[20px] font-pbold mr-4`}>лента</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className=""
          onPress={() => { setTab(1) }}
        >
          <Text className={`${tab === 1 ? `text-white` : `text-[#838383]`} text-[20px] font-pbold`}>данные</Text>
        </TouchableOpacity>
      </View>

      {tab === 0 && (
        <View>
          <View className="bg-[#111] rounded-3xl mx-4 py-3">
            <Text className="text-white font-pbold mx-4 text-[20px]">добавь запись</Text>
            <FormField
              title={'содержание'}
              value={caption}
              max={2000}
              handleChangeText={(e) => setCaption(e)}
              multiline={true}
              numberOfStrokes={4}
              otherStyles={'mx-4 mt-2 mb-1'}
            />

            {caption.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  createPost({
                    userId: user.$id,
                    caption: caption,
                  })
                  setCaption('');
                  router.push('/profile')
                  onRefresh()
                }}
                className="bg-white mx-4 rounded-xl py-2 mt-1 mb-1">
                <Text className="text-black font-pregular text-center text-[19px]">опубликовать</Text>
              </TouchableOpacity>
            )}
          </View>

          {combinedList.map(item => (
            item.caption ? (
              <TouchableOpacity
                onPress={() => {
                  setPost(item);
                  setPostShown(true);
                  ref.current.scrollTo({ y: 0, animated: true });
                }}
                className="bg-[#111] mx-4 py-3 rounded-3xl px-4 mt-4">
                <View className="flex flex-row">
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-[52px] h-[52px] rounded-xl mr-3"
                  />
                  <View className="flex flex-col">
                    <Text className="text-white mr-4 text-[19px] font-pbold">{user.name}</Text>
                    <Text className="text-[#838383] mr-4 text-[17px] font-pregular">{formatDate(item.$createdAt)}</Text>
                  </View>
                </View>


                <View className="h-[2px] bg-[#222] rounded-xl my-4"></View>
                <Text className="text-[18px] font-pregular text-white">{item.caption}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity key={item.id} onPress={() => {
                setDetail(item);
                setDetailShown(true);
                ref.current.scrollTo({ y: 0, animated: true });
              }} className="bg-[#111] py-3 rounded-3xl mx-4 mt-4">
                <View className="flex flex-row mx-4">
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-[52px] h-[52px] rounded-xl mr-3"
                  />
                  <View className="flex flex-col">
                    <Text className="text-white mr-4 text-[19px] font-pbold">{user.name}</Text>
                    <Text className="text-[#838383] mr-4 text-[17px] font-pregular">{types[item.typ]?.title}, {formatDate(item.$createdAt)}</Text>
                  </View>
                </View>

                {item.description?.length > 0 && (
                  <Text className="text-[#838383] mx-4 text-[17px] mt-4 font-pregular">{item.description}</Text>
                )}

                <View className="mx-4 h-[2px] bg-[#222] rounded-xl my-4"></View>

                <View className="flex flex-row justify-between mx-4">
                  <View className="">
                    <Text className="font-pregular text-[#838383] text-[17px]">время</Text>
                    <Text className="font-pregular text-[#fff] text-[17px]">{formatTime(item.time)}</Text>
                  </View>

                  {item.distance > 0 && (
                    <View>
                      <Text className="font-pregular text-[#838383] text-[17px]">темп</Text>
                      <Text className="font-pregular text-[#fff] text-[17px]">{calculatePace(item.time, item.distance)}/км</Text>
                    </View>
                  )}

                  {item.distance > 0 && (
                    <View>
                      <Text className="font-pregular text-[#838383] text-[17px]">дистанция</Text>
                      <Text className="font-pregular text-[#fff] text-[17px]">{item.distance}км</Text>
                    </View>
                  )}

                  {item.exercises.length > 0 && (
                    <View>
                      <Text className="font-pregular text-[#838383] text-[17px]">упражнений</Text>
                      <Text className="font-pregular text-[#fff] text-[17px]">{item.exercises.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          ))}
        </View>
      )}

      {tab === 1 && (
        <View>
          <View className="mb-4 mx-4">
            <TouchableOpacity
              onPress={() => { router.push('/additional/levels') }}
              style={{ backgroundColor: rank[(user?.rank - 1)]?.color }}
              className="rounded-3xl py-3"
            >
              <Text className={`${rank[(user?.rank - 1)]?.text === 'white' ? `text-white` : `text-black`} font-pbold mx-4 text-[20px]`}>{user?.rank} уровень</Text>
              <Text className={`${rank[(user?.rank - 1)]?.text === 'white' ? `text-white` : `text-black`} font-pregular mx-4 text-[18px]`}>{rank[(user?.rank - 1)]?.name}</Text>

              <View className="mx-4 mt-4" style={styles.outerBlock}>
                <View style={[styles.innerBlock, { width: blockWidth }]} />
                <Text className="left-0 bottom-[3px] text-[18px] w-full text-center absolute font-pregular text-[#000]">{user?.exp}/{rank[(user?.rank - 1)]?.exp}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="bg-[#111] mx-4 mb-[-16px] px-4 py-3 rounded-t-3xl">
            <Text className="text-[#838383] font-pregular text-[20px]">за 7 дней</Text>

            <TouchableOpacity onPress={() => { router.push('/weight') }} className="flex flex-row justify-between items-center pb-1 border-b-[#222222] border-b-2">
              <View className="flex flex-row items-center">
                <Image
                  source={icons.weight}
                  className="w-5 h-5 mt-1 mr-2"
                />
                <Text className="text-[#ffffff] font-pbold text-[21px]">масса</Text>
              </View>

              {form.changes.weight < 0 ? (
                <Text className="text-[#ff817f] font-pregular text-[19px]">{form.changes.weight}кг<Text className="text-[#838383]"> · {form.weight}кг</Text></Text>
              ) : form.changes.weight > 0 ? (
                <Text className="text-[#89ff9d] font-pregular text-[19px]">+{form.changes.weight}кг<Text className="text-[#838383]"> · {form.weight}кг</Text></Text>
              ) : (
                <Text className="text-[#838383] font-pregular text-[19px]">такая же<Text className="text-[#838383]"> · {form.weight}кг</Text></Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity className="flex flex-row justify-between items-center pb-1 border-b-[#222] border-b-2">
              <View className="flex flex-row items-center">
                <Image
                  source={icons.workout}
                  className="w-5 h-5 mt-1 mr-2"
                />
                <Text className="text-[#ffffff] font-pbold text-[21px]">тренировки</Text>
              </View>
              <Text className="text-[#838383] font-pregular text-[19px]">{formatTime(calculateTotalTime())}</Text>
            </TouchableOpacity>
            <Text className="text-[#838383] font-pregular mt-2 text-[19px]">график изменения массы</Text>
          </TouchableOpacity>


          <View className="flex flex-row flex-1">
            <View className="w-full p-4">
              {weekly.weight.length !== 0 && (
                <LineChart
                  data={{
                    datasets: [
                      {
                        data: weekly.weight.map(item => item.val),
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width * 0.85}
                  height={150}
                  yAxisLabel=""
                  yAxisSuffix="кг"
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: '#111',
                    backgroundGradientFrom: '#111',
                    backgroundGradientTo: '#111',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  className="bg-[#111] py-5 rounded-b-3xl"
                />)}
            </View>
          </View>

          <View className="bg-[#111] mx-4 py-2 rounded-3xl">
            <Text className="text-white font-pbold mx-4 text-[19px] mb-4">твои данные изменились?</Text>
            <View className="w-[100%] px-4 mb-4">
              <View>
                <TextInput
                  value={tosave.toString()}
                  onChangeText={(text) => {
                    // Регулярное выражение для проверки, что ввод состоит только из цифр и одной точки
                    const isValidInput = /^\d*\.?\d*$/.test(text);
                    if (isValidInput) {
                      // Создание нового массива с добавленным значением
                      setTosave(text)
                    }
                  }}
                  keyboardType="numeric"
                  className="bg-[#191919] w-full rounded-xl py-2 text-white font-pregular text-[17px] px-2"
                />
                <Text className="text-[#bababa] font-pregular text-[14px] mt-1 ml-2">масса</Text>
              </View>
            </View>

            {weekly.weight[weekly.weight.length - 1]?.val !== tosave && tosave.length > 0 && (
              <TouchableOpacity className="bg-white py-2 rounded-xl mx-4 mb-2"
                onPress={async () => {
                  const updatedWeightList = [...form.weightList,
                  {
                    val: parseFloat(tosave),
                  }
                  ].filter(item => item.val !== undefined); // Удаляем объекты без ключа 'val'
                  setForm({ ...form, weight: tosave, weightList: updatedWeightList });
                  console.log('updatedWeightList: ', updatedWeightList);


                  setRefreshing(true);
                  const done = await updateWeekly(
                    user.$id,
                    updatedWeightList
                  );

                  if (done) {
                    onRefresh();
                  }
                }}
              >
                <Text className="text-[#000] font-pregular text-[19px] text-center">сохранить</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="bg-[#111] mx-4 pt-2 pb-4 rounded-3xl mt-4">
            <Text className="text-white font-pbold mx-4 text-[19px] mb-2">тренировки</Text>
            {completed.length === 0 && (<>
              <Text className="text-[#838383] font-pregular mx-4 text-[19px] mb-2">пока ни одной :(</Text>
              <TouchableOpacity className="bg-white mx-4 rounded-xl py-2" onPress={() => { router.push('/bookmark') }}>
                <Text className="text-black font-pregular text-center text-[19px]">запиши</Text>
              </TouchableOpacity>
            </>
            )}

            <ScrollView
              horizontal={true}
              className="w-[100%]"
            >
              {completed.map(item =>
                <TouchableOpacity onPress={() => {
                  setDetail(item);
                  setDetailShown(true);
                  ref.current.scrollTo({ y: 0, animated: true });
                }} className="bg-[#222] py-2 rounded-xl mx-4 w-[84vw]">
                  <Text className="text-white font-pbold mx-4 text-[20px]">{types[item.typ].title}{item.distance > 0 && (`, ${item.distance}км`)}</Text>
                  <Text className="text-[#838383] font-pregular mx-4 text-[18px]">{formatTime(item.time)}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <TouchableOpacity className="bg-[#111] mx-4 py-3 rounded-3xl mt-4"
            onPress={() => { router.push('/additional/awards') }}
          >
            <View className="flex flex-row items-center mx-4">
              <Text className="text-white font-pbold mr-2 text-[19px]">награды</Text>
              <Image
                source={icons.right}
                className="w-6 h-6"
              />
            </View>
            {userAwards.length > 0 ? (
              <ScrollView
                horizontal={true}
                className="flex flex-row mx-4 mt-2">
                {userAwards.map(aw =>
                  <View className="bg-[#222] rounded-xl">
                    <Image
                      source={{ uri: aw.imageUrl }}
                      className="w-[80px] h-[80px]"
                    />
                  </View>
                )}
              </ScrollView>
            ) : (
              <View>
                <Text className="text-[#838383] text-[17px] font-pregular mx-4">наград пока нет</Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="bg-[#111] mx-4 py-3 rounded-3xl mt-4">
            <Text className="text-white font-pbold mx-4 text-[19px]">о себе</Text>
            <View className="z-20 flex w-full flex-row flex-wrap px-4 pr-[12px]">
              <Text className="text-[#838383] mr-1 text-[16px] font-pregular">интересуюсь:</Text>
              {filteredList.map(kind => (
                <View key={kind.id} className="bg-[#252525] border-[1px] border-[#292929] shadow-lg flex relative rounded-3xl mr-[4px] mb-1 pt-[1px] pb-[3px] px-[9px] z-20">
                  <Text className="font-pregular text-[#bdbdbd] text-[16px]">{kind.title}</Text>
                </View>
              ))}
            </View>
            {user?.bio !== '' && user?.bio !== null && (
              <Text className="text-[#838383] mx-4 text-[16px] font-pregular">био: {user?.bio}</Text>
            )}
          </View>
        </View>)}
    </ScrollView>
  );
};

export default Profile;