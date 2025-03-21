import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Vibration, Image, TextInput, Animated, Dimensions } from 'react-native';
import { useGlobalContext } from '../../context/GlobalProvider';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { rank, types } from '../../constants/types';
import { saveCompleted, setCoins, setExp } from '../../lib/appwrite';
import PushNotification from 'react-native-push-notification';
import { LinearGradient } from 'expo-linear-gradient';
import { exercises, oneProgram, swimmingExs } from '../../constants/exercises'
import { icons } from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FormField } from '../../components';
import mapTemplate from '../map-template';
import Slider from '@react-native-community/slider';

const Bookmark = () => {
  const { user } = useGlobalContext();
  const filteredList = types.filter(item => user?.sports?.includes(item.key));
  const [current, setCurrent] = useState(filteredList[0]);
  const [isTracking, setIsTracking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeinterval, setTimeinterval] = useState(10000);
  const [distance, setDistance] = useState(0);
  const [lastPosition, setLastPosition] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [count, setCount] = useState(5);
  const [counterShown, setCounterShown] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [optionsShown, setOptionsShown] = useState(false);
  const [exsShown, setExsShown] = useState(false);
  const [programmShown, setProgrammShown] = useState(false);
  const [curPr, setCurPr] = useState({});
  const [curPrShown, setCurPrShown] = useState(false);
  const [shown, setShown] = useState(false);
  const [fromBottom, setFromBottom] = useState(-400);
  const [exercise, setExercise] = useState({});
  const [description, setDescription] = useState('');
  const [forCount, setForCount] = useState({
    left: 0,
    right: 0
  });
  const watchSubscriptionRef = useRef(null);
  const [fav, setFav] = useState([]);
  const [doing, setDoing] = useState([]);
  const [swimming, setSwimming] = useState([]);
  const [started, setStarted] = useState();
  const [doingPull, setDoingPull] = useState([{
    name: 'подтягивания'
  }]);
  const [lastPaused, setLastPaused] = useState(0);
  const [totalPaused, setTotalPaused] = useState(0);
  const [val, setVal] = useState(0);

  const route = useRoute();
  const { width } = Dimensions.get("window");

  useEffect(() => {
    if (route.params && route.params.items) {
      const newExercises = route.params.items.map(index => ({
        ...exercises[index],
        reps: [
          {
            reps: 0,
            weight: 0
          }
        ] // или любое значение по умолчанию
      }));
      setDoing(prevDoing => [...prevDoing, ...newExercises]);
    }
  }, [route.params]);


  const trackLabels = {
    1: 'пройдено',
    2: 'темп',
    3: 'скорость',
    4: 'сред. скорость',
    5: 'счёт',
    6: 'подъём'
  };

  const handlePress = (item) => {
    setCurrent(item); // Устанавливаем текущее значение
  };


  filteredList.push({
    title: 'другое',
    a: 'тренировку'
  });
  const timerRef = useRef(null);


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

  const transformCoordinates = () => {
    return coordinates.map(coord => ({
      x: coord.latitude,
      y: coord.longitude
    }));
  };

  useEffect(() => {
    if (isTracking && !paused) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(parseInt((Date.now() - started) / 1000) - totalPaused);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null; // Сбросить ссылку
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking, paused]);

  const webRef = useRef(null);

  useEffect(() => {
    let watchSubscription;

    const startTracking = async () => {
      if (current.track.includes(1)) {
        await Location.requestForegroundPermissionsAsync();
        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1,
            timeInterval: timeinterval
          },
          position => {
            const { latitude, longitude } = position.coords;

            webRef?.current?.injectJavaScript(`flyToUserLocation({"latitude": ${latitude}, "longitude": ${longitude}});`);

            // Проверяем, есть ли lastPosition
            if (lastPosition) {
              const newDistance = calculateDistance(lastPosition, { latitude, longitude });
              console.log(newDistance)

              // Если расстояние больше 1 метра, добавляем новую позицию
              if (newDistance > 0.005) {
                setCoordinates(coords => {
                  const newCoords = [...coords, { latitude, longitude }];
                  console.log(coordinates)

                  // Вызов drawRoutes с новыми координатами в нужном формате
                  const formattedRoutes = newCoords.map(coord => [coord.latitude, coord.longitude]);
                  webRef?.current?.injectJavaScript(`drawRoutes([${JSON.stringify(formattedRoutes)}]);`);

                  return newCoords;
                });
                setLastPosition({ latitude, longitude });
                setDistance(prevDistance => prevDistance + newDistance);
              }
            } else {
              // Если lastPosition отсутствует, добавляем первую точку
              setCoordinates([{ latitude, longitude }]);
              setLastPosition({ latitude, longitude });
            }
          }
        );
      }
    };

    if (isTracking && ['0', '10', '13'].includes(current.key) && !paused) {
      startTracking();
    }

    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [isTracking, current.key, lastPosition]);

  useEffect(() => {
    if (val === 2) {
      setTimeinterval(3000)
    }
    else if (val === 1) {
      setTimeinterval(6000)
    }
    else {
      setTimeinterval(10000)
    }
  }, [val])


  const handleStart = () => {
    setCount(5);
    setCounterShown(true);
    setIsSaving(false);

    const countdownInterval = setInterval(() => {
      setCount(prevCount => {
        if (prevCount <= 1) {
          clearInterval(countdownInterval);
          setCounterShown(false);
          setIsTracking(true);
          setStarted(Date.now())
          return 0;
        } else {
          Vibration.vibrate(100);
          return prevCount - 1;
        }
      });
    }, 1000);
  };

  const handlePause = () => {
    if (paused === false) {
      setLastPaused(Date.now())
    }
    else {
      setTotalPaused(totalPaused + 1 + parseInt((Date.now() - lastPaused) / 1000))
    }
    setPaused(!paused);
  };

  const handleFinish = () => {
    setIsSaving(true);
    setIsTracking(false);
    setPaused(false);
    setTotalPaused(0);
  };

  const findMatchingIndices = () => {
    const doingTitles = doing.map(item => item.title);
    const indices = [];

    exercises.forEach((exercise, index) => {
      if (doingTitles.includes(exercise.title)) {
        indices.push(index);
      }
    });

    return indices;
  };

  const descs = ['твоя геопозиция записывается плохо, но экономится заряд батареи', 'средняя точность, средняя экономия', 'максимальная точность, но телефон быстро разрядится']


  function getDistance(coord1, coord2) {
    const R = 6371e3; // Радиус Земли в метрах
    const lat1 = coord1.latitude * (Math.PI / 180); // Переводим широту в радианы
    const lat2 = coord2.latitude * (Math.PI / 180); // Переводим широту в радианы
    const deltaLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180); // Изменение широты в радианах
    const deltaLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180); // Изменение долготы в радианах

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Возвращаем расстояние в метрах
  }

  function filterCoordinates() {
    const result = [];
    const maxDistance = distance * 1000; // В метрах

    // Добавляем первую координату в результат
    if (coordinates.length > 0) {
      result.push(coordinates[0]);
    }

    for (let i = 1; i < coordinates.length; i++) {
      // Получаем последнюю добавленную координату
      const lastCoord = result[result.length - 1];

      // Вычисляем расстояние до текущей координаты
      const dist = getDistance(
        { latitude: lastCoord.latitude, longitude: lastCoord.longitude },
        { latitude: coordinates[i].latitude, longitude: coordinates[i].longitude }
      );

      // Если расстояние больше maxDistance, добавляем координату
      if (dist > maxDistance) {
        result.push(coordinates[i]);
      }
    }
    return result;
  }

  const handleConfirmFinish = () => {
    saveCompleted(user.$id, parseInt(current.key), timeElapsed, parseFloat(distance).toFixed(2), findMatchingIndices(), description, transformCoordinates(coordinates))
    setCoins(user.$id, user.balance + (timeElapsed / 60))
    setExp(user, user.exp + (timeElapsed / 30))
    setIsTracking(false);
    setTimeElapsed(0);
    setTotalPaused(0);
    setDescription('');
    setDoing([]);
    setStarted()
    setSwimming([]);
    setForCount({
      left: 0,
      right: 0
    })
    setDistance(0);
    setCoordinates([])
    setIsSaving(false);
  };


  const handleConfirmCancel = () => {
    setIsTracking(false);
    setTimeElapsed(0);
    setStarted()
    setTotalPaused(0);
    setDescription('');
    setForCount({
      left: 0,
      right: 0
    })
    setDistance(0);
    setCoordinates([])
    setIsSaving(false);
  };



  const calculateDistance = (startCoords, endCoords) => {
    const toRad = value => (value * Math.PI) / 180;
    const earthRadius = 6371; // Radius of Earth in km
    const dLat = toRad(endCoords.latitude - startCoords.latitude);
    const dLon = toRad(endCoords.longitude - startCoords.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(startCoords.latitude)) * Math.cos(toRad(endCoords.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c; // Distance in km
  };

  const formatTime = time => {
    const hours = String(Math.floor(time / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const pace = calculatePace(timeElapsed, distance);

  const handleFavorite = async (ex) => {
    setFav((prev) => {
      const newFav = prev.includes(ex)
        ? prev.filter(item => item !== ex) // Удаляем объект
        : [...prev, ex]; // Добавляем объект

      AsyncStorage.setItem('favorites', JSON.stringify(newFav)); // Обновляем AsyncStorage

      return newFav;
    });
  };

  // При старте компонента загрузите сохраненные фавориты
  useEffect(() => {
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFav(JSON.parse(storedFavorites)); // Устанавливаем загруженные фавориты
      }
    };

    loadFavorites();
  }, []);

  const handleDoing = (ex) => {
    setDoing((prev) =>
      prev.some(item => item.title === ex.title) ? prev.filter(item => item.title !== ex.title) : [...prev, {
        title: ex.title,
        weightNeed: ex.weightNeed,
        reps: [
          {
            reps: 10,
            weight: 20
          }
        ]
      }]
    );
  };

  const handleSwimming = (ex) => {
    setSwimming((prev) =>
      prev.some(item => item.title === ex.title) ? prev.filter(item => item.title !== ex.title) : [...prev, {
        title: ex.title,
        weightNeed: ex.weightNeed,
        reps: [
          {
            reps: 10,
            weight: 20
          }
        ]
      }]
    );
  };

  const getTrackedData = () => {
    var trackedData = [];

    current?.track?.forEach(trackId => {
      if (trackLabels[trackId]) {
        switch (trackId) {
          case 1:
            trackedData.push({ label: trackLabels[trackId], value: `${distance.toFixed(2)}`, meas: 'км' });
            break;
          case 2:
            trackedData.push({ label: trackLabels[trackId], value: calculatePace(timeElapsed, distance), meas: 'мин/км' });
            break;
          case 3:
            trackedData.push({ label: trackLabels[trackId], value: '0', meas: 'км/ч' });
            break;
          case 4:
            trackedData.push({ label: trackLabels[trackId], value: '0', meas: 'км/ч' });
            break;
          case 5:
            trackedData.push({ label: trackLabels[trackId], value: `${forCount.left}:${forCount.right}` });
            break;
          case 6:
            trackedData.push({ label: trackLabels[trackId], value: `100м` });
            break;
          default:
            break;
        }
      }
    });

    return trackedData;
  }

  const trackedData = getTrackedData();


  return (
    <>
      {shown && (
        <View className="bg-[#222] absolute z-[50] top-[30vh] left-4 right-4 px-4 py-3 rounded-3xl">
          <Text className="text-white text-[20px] font-pbold">не сохранять тренировку?</Text>
          <Text className="text-[#838383] text-[18px] font-pregular">достижения не зачислятся и открыть эту тренировку потом ты уже не сможешь</Text>
          <TouchableOpacity onPress={() => {
            handleConfirmCancel();
            setShown(false);
          }} className="bg-[#333] py-2 rounded-2xl mt-2">
            <Text className="text-center text-[19px] font-pregular text-white">не сохранять</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { handleConfirmFinish() }} className="bg-[#fff] py-2 rounded-2xl mt-3">
            <Text className="text-center text-[19px] font-pregular">сохранить</Text>
          </TouchableOpacity>
        </View>
      )}

      {counterShown && (
        <View className="bg-[#000] w-[100vw] h-[100vh] absolute top-0 z-30">
          <Text className="text-[80px] mt-[40vh] text-center font-psemibold text-white">{count}</Text>
          <Text className="text-[24px] mt-[6px] text-center font-pregular text-white">light weight, baby!</Text>
        </View>
      )}
      <View className="bg-[#000] p-0 h-[100vh] pt-10">
        <View contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="b-4 h-[100vh]">
            {!isTracking && (
              <View>
                <LinearGradient className="w-[60px] h-10 absolute right-0 z-10" start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 0 }} colors={['#fff0', '#000']} />

                <ScrollView className="mx-0 px-4 mb-4 flex flex-row" horizontal showsHorizontalScrollIndicator={false}>
                  {filteredList.map(item => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handlePress(item)}>
                      <Text
                        className="font-psemibold mr-[12px]"
                        style={[{
                          color: '#838383',
                          fontSize: 18
                        }, current.key === item.key && {
                          color: '#fff',
                        }]}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {optionsShown && (
              <View className="w-[100vw] h-[400px] bg-[#111] absolute bottom-0 left-0 z-20 px-4">

                <TouchableOpacity onPress={() => { setOptionsShown(false) }}>
                  <Image
                    source={icons.close}
                    className="w-8 h-8 absolute right-0 top-4"
                    tintColor={'white'}
                  />
                </TouchableOpacity>

                <TouchableOpacity className="flex flex-row items-center mt-[50px]">
                  <Image
                    source={icons.box}
                    className="w-5 h-5 mr-4"
                    tintColor={'white'}
                  />
                  <Text className="font-pregular text-[19px] text-white">поделиться тренировкой</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex flex-row items-center mt-2">
                  <Image
                    source={icons.box}
                    className="w-5 h-5 mr-4"
                    tintColor={'white'}
                  />
                  <Text className="font-pregular text-[19px] text-white">сохранить тренировку</Text>
                </TouchableOpacity>
              </View>
            )}

            {isTracking ? (
              <TouchableOpacity className="absolute right-6 top-[11px] z-10 bg-[#ffffff24] rounded-lg p-1"
                onPress={() => { setOptionsShown(true) }}
              >
                <Image
                  source={icons.dots}
                  tintColor={'#fff'}
                  className="w-8 h-8"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="absolute right-6 top-[52px] z-10 bg-[#ffffff24] rounded-lg p-1"
                onPress={() => { setOptionsShown(true) }}
              >
                <Image
                  source={icons.dots}
                  tintColor={'#fff'}
                  className="w-8 h-8"
                />
              </TouchableOpacity>
            )}
            <View className="bg-primary rounded-xl mb-4 mx-4 py-1">
              <Text className="text-[#fff] font-pbold text-[37px] text-center">{formatTime(timeElapsed)}</Text>
            </View>

            <View className="px-4 flex flex-row flex-wrap w-[100vw] justify-between">
              {trackedData.map((data, index) => (
                <View key={index} className="w-[43.75vw] bg-[#111] m-1 py-1 px-2 rounded-xl">
                  <Text className="text-[#838383] font-pregular text-[17px]">{data.label}</Text>
                  <Text className="text-white text-[30px] font-psemibold">{data.value}<Text className="text-[17px] font-pregular text-[#838383]">{data?.meas}</Text></Text>
                </View>
              ))}


              {['0', '10', '13'].includes(current.key) && !isTracking && (
                <View className="w-full bg-[#111] py-2 rounded-xl mt-1">
                  <Text className="text-white font-pregular mx-4 text-[17px]">точность</Text>
                  <View className="flex-1 items-center justify-center my-4">
                    <Slider
                      style={{ width: width - 32, height: 100 }}
                      value={val}
                      className=""
                      onValueChange={(value) => setVal(value)}
                      minimumValue={0}
                      maximumValue={2}
                      step={1}
                      minimumTrackTintColor="#FFFFFF"
                      maximumTrackTintColor="#555"
                    />
                  </View>
                  <Text className="text-[#838383] font-pregular mx-4 text-[17px]">{descs[val]}</Text>
                </View>
              )}

              {['0', '10', '13'].includes(current.key) && (
                <View className="w-full h-[30vh] mt-4">
                  <WebView
                    ref={webRef}
                    style={{ marginTop: -8, marginLeft: -8 }}
                    originWhitelist={['*']}
                    source={{ html: mapTemplate }}
                  />
                </View>
              )}

              {current.key === '1' && (
                <View className="w-full">
                  {
                    programmShown && (
                      <View className="z-20 bg-black w-full h-[100vh] absolute top-[-150px] pt-10">
                        <TouchableOpacity onPress={() => { setProgrammShown(false) }}>
                          <Image
                            className="w-8 h-8"
                            tintColor="#fff"
                            source={icons.close}
                          />
                        </TouchableOpacity>

                        {oneProgram.map(pr =>
                          <TouchableOpacity key={pr} onPress={() => {
                            setCurPr(pr)
                            setCurPrShown(true)
                            setProgrammShown(false)
                          }} className="bg-[#111] px-4 py-4 rounded-3xl mt-4">
                            <Text className="text-white text-[19px] font-pbold">{pr.name}</Text>
                            <Text className="text-[#838383] text-[18px] font-pregular">{pr.desc}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  }

                  {
                    curPrShown && (
                      <View className="z-20 bg-black w-full h-[100vh] absolute top-[-150px] pt-10">
                        <TouchableOpacity onPress={() => { setCurPrShown(false) }}>
                          <Image
                            className="w-8 h-8"
                            tintColor="#fff"
                            source={icons.close}
                          />
                        </TouchableOpacity>

                        <Text className="text-white text-[20px] font-pbold text-center">{curPr.name}</Text>

                        {curPr.exercises.map((item, index) =>
                          <View key={index} className="bg-[#111] px-4 rounded-3xl mt-4 py-3 flex flex-row flex-wrap justify-between items-center">
                            <Text className="text-white text-[20px] font-pregular">{item.title}, {item.reps.length}×{item.reps[0].reps}</Text>

                            <TouchableOpacity onPress={() => {
                              setCurPr(prev => ({
                                ...prev,
                                exercises: prev.exercises.filter((_, i) => i !== index)
                              }));
                            }}>
                              <Image
                                source={icons.minus}
                                className="w-6 h-6 opacity-50"
                              />
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            setDoing(curPr.exercises);
                            setCurPrShown(false);
                          }}
                          className="bg-white pb-3 pt-1 rounded-2xl absolute bottom-[78px] w-full right-3 left-1">
                          <Text className="text-black font-pregular text-[20px] mt-1 text-center">применить</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  }

                  {exsShown && (
                    <View className="z-20 bg-black w-full h-[100vh] absolute top-[-150px]">
                      <ScrollView className="pt-10 left-0 mb-[100px]">
                        <TouchableOpacity onPress={() => { setExsShown(false) }}>
                          <Image
                            className="w-8 h-8"
                            tintColor="#fff"
                            source={icons.close}
                          />
                        </TouchableOpacity>

                        <ScrollView horizontal={true}
                          className="pb-1 mt-4"
                        >
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 0 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(0)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 0 ? "text-black" : "text-[#838383]"}`}>
                              все
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 1 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(1)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 1 ? "text-black" : "text-[#838383]"}`}>
                              избранные
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 2 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(2)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 2 ? "text-black" : "text-[#838383]"}`}>
                              руки
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 3 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(3)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 3 ? "text-black" : "text-[#838383]"}`}>
                              грудь
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 4 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(4)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 4 ? "text-black" : "text-[#838383]"}`}>
                              спина
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 5 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(5)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 5 ? "text-black" : "text-[#838383]"}`}>
                              ноги
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 6 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(6)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 6 ? "text-black" : "text-[#838383]"}`}>
                              плечи
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`py-1 px-4 mr-2 rounded-xl ${currentTab === 7 ? "bg-white" : "bg-[#111]"}`}
                            onPress={() => setCurrentTab(7)}
                          >
                            <Text className={`text-[19px] font-pregular ${currentTab === 7 ? "text-black" : "text-[#838383]"}`}>
                              предплечья
                            </Text>
                          </TouchableOpacity>
                        </ScrollView>

                        {exercises
                          .filter(ex => currentTab === 0 || (currentTab === 1 ? ex.isLiked === true : ex.tab === currentTab))
                          .map((ex, index) => (
                            <TouchableOpacity
                              key={index}
                              className={`${doing.some(item => item.title === ex.title) ? "bg-[#fff]" : "bg-[#111]"} my-1 rounded-xl flex-row items-center justify-left`}
                              onPress={() => handleDoing(ex)}
                            >
                              {ex.img && (
                                <Image
                                  source={{ uri: ex.img }}
                                  className="w-[85px] h-[85px] rounded-l-xl bg-[#fff]"
                                />
                              )}
                              <View className="flex flex-col">
                                <View className="flex flex-row ml-4 mt-2 mr-[90px] items-center flex-wrap">
                                  <Text className={`${doing.some(item => item.title === ex.title) ? "text-[#000]" : "text-[#fff]"} text-wrap font-pbold text-[18px] mr-2`}>{ex.title}</Text>
                                  <TouchableOpacity onPress={() => handleFavorite(ex)}>
                                    <Image
                                      className="w-[21px] h-[21px] mr-2"
                                      tintColor={fav.includes(ex) ? "#ff0000" : "#838383"}
                                      source={icons.heart}
                                    />
                                  </TouchableOpacity>
                                </View>

                                {ex.description && (
                                  <Text className={`${doing.some(item => item.title === ex.title) ? "text-[#666]" : "text-[#838383]"}  font-pregular text-[16px] ml-4 mr-[102px] leading-[17px] mb-2`}>{ex.description}</Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          ))}

                        <View className="mt-[14vh]"></View>
                      </ScrollView>

                      <TouchableOpacity className="bg-[#fff] py-3 rounded-2xl z-10 absolute bottom-[85px] w-full" onPress={() => { setExsShown(false) }}>
                        <Text className='font-pregular text-black text-[18px] text-center'>готово</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <ScrollView className="h-[90vh] mb-2">
                    {doing?.map(exe =>
                      <View key={exe} className="bg-[#111] py-3 rounded-2xl mb-2 pb-[40px]">
                        <View className="flex flex-row justify-between mb-1">
                          <Text className="text-white font-pbold text-[18px] mx-4 mb-2">{exe.title}</Text>
                          <TouchableOpacity onPress={() => { setExercise(exe); setFromBottom(0) }}>
                            <Image
                              source={icons.dots}
                              className="w-6 h-6 mr-4"
                              tintColor={'#fff'}
                            />
                          </TouchableOpacity>
                        </View>

                        <View className="rounded-2xl">
                          {exe.reps?.map(rep =>
                            <><View className="flex flex-row w-[100%] justify-between px-4 mb-4">
                              <View className="flex items-center justify-center h-[45px]">
                                <Text className="text-white width-[5vw] text-[21px] font-pbold">{exe.reps.indexOf(rep) + 1}</Text>
                              </View>

                              {exe.weightNeed === false ? (
                                <View className="w-[77vw] mb-1">
                                  <TextInput
                                    value={rep.reps}
                                    keyboardType="numeric"
                                    handleChangeText={(e) => setDoing(prevState => ({
                                      ...prevState,
                                      exercises: prevState.exercises.map(exe => exe.title === executing.title ? { ...exe, reps: e } : exe
                                      )
                                    }))}
                                    className="bg-[#191919] rounded-xl py-2 text-white font-pregular text-[17px] px-2" />

                                  <Text className="text-[#bababa] font-pregular text-[14px] mt-1 ml-2">повторений</Text>
                                </View>
                              ) : (
                                <><View className="mb-1">
                                  <TextInput
                                    value={rep.reps}
                                    keyboardType="numeric"
                                    handleChangeText={(e) => setDoing(prevState => ({
                                      ...prevState,
                                      exercises: prevState.exercises.map(exe => exe.title === executing.title ? { ...exe, reps: e } : exe
                                      )
                                    }))}
                                    className="bg-[#191919] w-[38vw] rounded-xl py-2 text-white font-pregular text-[17px] px-2" />

                                  <Text className="text-[#bababa] font-pregular text-[14px] mt-1 ml-2">повторений</Text>
                                </View><View className="mb-1">
                                    <TextInput
                                      value={rep.weight}
                                      keyboardType="numeric"
                                      handleChangeText={(e) => setDoing(prevState => ({
                                        ...prevState,
                                        exercises: prevState.exercises.map(exe => exe.title === executing.title ? { ...exe, weight: e } : exe
                                        )
                                      }))}
                                      className="bg-[#191919] w-[38vw] rounded-xl py-2 text-white font-pregular text-[17px] px-2" />
                                    <Text className="text-[#bababa] font-pregular text-[14px] mt-1 ml-2">килограмм</Text>
                                  </View></>
                              )}

                            </View>



                              <View className="flex bottom-0 absolute justify-center items-center w-full">
                                <TouchableOpacity
                                  onPress={() => {
                                    setDoing([...doing.map(item => exe.title === item.title ? { ...item, reps: [...item.reps, { reps: 10, weight: 20 }] } : item)]);
                                  }}
                                  className="bg-[#191919] absolute bottom-[-30px] h-[36px] px-4 rounded-xl">
                                  <Text className='font-pregular text-white text-[18px] text-center mt-1'>+ подход</Text>
                                </TouchableOpacity>
                              </View></>
                          )}
                        </View>
                      </View>
                    )}

                    <View className="mt-[50vh]"></View>
                  </ScrollView>


                  {doing.length === 0 ? (
                    <View className="absolute top-[47vh] left-0 right-0">
                      <TouchableOpacity className="bg-[#111] py-3 rounded-2xl" onPress={() => { setProgrammShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>выбери готовую тренировку</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="bg-[#111] py-3 rounded-2xl mt-2" onPress={() => { setExsShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>добавь упражение</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex flex-row justify-between mt-8 absolute top-[51vh]">
                      <TouchableOpacity className="bg-[#090909] py-3 rounded-2xl w-[49%]" onPress={() => { setProgrammShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>готовая</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="bg-[#090909] py-3 rounded-2xl w-[49%]" onPress={() => { setExsShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>добавь</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}


              {current.key === '5' && (
                <View className="w-full">
                  {
                    programmShown && (
                      <View className="z-20 bg-black w-full h-[100vh] absolute top-[-150px] pt-10">
                        <TouchableOpacity onPress={() => { setProgrammShown(false) }}>
                          <Image
                            className="w-8 h-8"
                            tintColor="#fff"
                            source={icons.close}
                          />
                        </TouchableOpacity>

                        {oneProgram.map(pr =>
                          <TouchableOpacity key={pr} onPress={() => {
                            setCurPr(pr)
                            setCurPrShown(true)
                            setProgrammShown(false)
                          }} className="bg-[#111] px-4 py-4 rounded-3xl mt-4">
                            <Text className="text-white text-[19px] font-pbold">{pr.name}</Text>
                            <Text className="text-[#838383] text-[18px] font-pregular">{pr.desc}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  }

                  {
                    curPrShown && (
                      <View className="z-20 bg-black w-full h-[100vh] absolute top-[-150px] pt-10">
                        <TouchableOpacity onPress={() => { setCurPrShown(false) }}>
                          <Image
                            className="w-8 h-8"
                            tintColor="#fff"
                            source={icons.close}
                          />
                        </TouchableOpacity>

                        <Text className="text-white text-[20px] font-pbold text-center">{curPr.name}</Text>

                        {curPr.exercises.map((item, index) =>
                          <View key={index} className="bg-[#111] px-4 rounded-3xl mt-4 py-3 flex flex-row flex-wrap justify-between items-center">
                            <Text className="text-white text-[20px] font-pregular">{item.title}, {item.reps.length}×{item.reps[0].reps}</Text>

                            <TouchableOpacity onPress={() => {
                              setCurPr(prev => ({
                                ...prev,
                                exercises: prev.exercises.filter((_, i) => i !== index)
                              }));
                            }}>
                              <Image
                                source={icons.minus}
                                className="w-6 h-6 opacity-50"
                              />
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            setDoing(curPr.exercises);
                            setCurPrShown(false);
                          }}
                          className="bg-white pb-3 pt-1 rounded-2xl absolute bottom-[78px] w-full right-3 left-1">
                          <Text className="text-black font-pregular text-[20px] mt-1 text-center">применить</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  }

                  {exsShown && (
                    <View className="z-20 bg-black w-full h-[100vh] absolute top-[-150px]">
                      <ScrollView className="pt-10 left-0 mb-[100px]">
                        <TouchableOpacity onPress={() => { setExsShown(false) }}>
                          <Image
                            className="w-8 h-8"
                            tintColor="#fff"
                            source={icons.close}
                          />
                        </TouchableOpacity>

                        {swimmingExs
                          .map((ex, index) => (
                            <TouchableOpacity
                              key={index}
                              className={`${swimming.some(item => item.title === ex.title) ? "bg-[#fff]" : "bg-[#111]"} my-1 rounded-xl flex-row items-center justify-left`}
                              onPress={() => handleSwimming(ex)}
                            >
                              {ex.img && (
                                <Image
                                  source={{ uri: ex.img }}
                                  className="w-[85px] h-[85px] rounded-l-xl bg-[#fff]"
                                />
                              )}
                              <View className="flex flex-col">
                                <View className="flex flex-row ml-4 mt-2 mr-[90px] items-center flex-wrap">
                                  <Text className={`${swimming.some(item => item.title === ex.title) ? "text-[#000]" : "text-[#fff]"} text-wrap font-pbold text-[18px] mr-2`}>{ex.title}</Text>
                                  <TouchableOpacity onPress={() => handleFavorite(ex)}>
                                    <Image
                                      className="w-[21px] h-[21px] mr-2"
                                      tintColor={fav.includes(ex) ? "#ff0000" : "#838383"}
                                      source={icons.heart}
                                    />
                                  </TouchableOpacity>
                                </View>

                                {ex.description && (
                                  <Text className={`${swimming.some(item => item.title === ex.title) ? "text-[#666]" : "text-[#838383]"}  font-pregular text-[16px] ml-4 mr-[102px] leading-[17px] mb-2`}>{ex.description}</Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>

                      <TouchableOpacity className="bg-[#fff] py-3 rounded-2xl z-10 absolute bottom-[85px] w-full" onPress={() => { setExsShown(false) }}>
                        <Text className='font-pregular text-black text-[18px] text-center'>готово</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <ScrollView className="h-[55vh] mb-2">
                    {swimming?.map(exe =>
                      <View key={exe} className="bg-[#111] py-3 rounded-2xl mb-2 pb-[40px]">
                        <View className="flex flex-row justify-between mb-1">
                          <Text className="text-white font-pbold text-[18px] mx-4 mb-2">{exe.title}</Text>
                          <TouchableOpacity onPress={() => { setExercise(exe); setFromBottom(0) }}>
                            <Image
                              source={icons.dots}
                              className="w-6 h-6 mr-4"
                              tintColor={'#fff'}
                            />
                          </TouchableOpacity>
                        </View>

                        <View className="rounded-2xl">
                          {exe.reps?.map(rep =>
                            <><View className="flex flex-row w-[100%] justify-between px-4 mb-4">
                              <View className="flex items-center justify-center h-[45px]">
                                <Text className="text-white width-[5vw] text-[21px] font-pbold">{exe.reps.indexOf(rep) + 1}</Text>
                              </View>

                              <View className="w-[77vw] mb-1">
                                <TextInput
                                  value={rep.reps}
                                  keyboardType="numeric"
                                  handleChangeText={(e) => setDoing(prevState => ({
                                    ...prevState,
                                    exercises: prevState.exercises.map(exe => exe.title === executing.title ? { ...exe, reps: e } : exe
                                    )
                                  }))}
                                  className="bg-[#191919] rounded-xl py-2 text-white font-pregular text-[17px] px-2" />

                                <Text className="text-[#bababa] font-pregular text-[14px] mt-1 ml-2">метров</Text>
                              </View>
                            </View>



                              <View className="flex bottom-0 absolute justify-center items-center w-full">
                                <TouchableOpacity
                                  onPress={() => {
                                    setDoing([...doing.map(item => exe.title === item.title ? { ...item, reps: [...item.reps, { reps: 10, weight: 20 }] } : item)]);
                                  }}
                                  className="bg-[#191919] absolute bottom-[-30px] h-[36px] px-4 rounded-xl">
                                  <Text className='font-pregular text-white text-[18px] text-center mt-1'>+ заплыв</Text>
                                </TouchableOpacity>
                              </View></>
                          )}
                        </View>
                      </View>
                    )}
                  </ScrollView>


                  {doing.length === 0 ? (
                    <View className="absolute top-[92%] left-0 right-0">
                      <TouchableOpacity className="bg-[#111] py-3 rounded-2xl" onPress={() => { setProgrammShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>выбери готовую тренировку</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="bg-[#111] py-3 rounded-2xl mt-2" onPress={() => { setExsShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>добавь упражение</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex flex-row justify-between mt-8">
                      <TouchableOpacity className="bg-[#111] py-3 rounded-2xl w-[49%]" onPress={() => { setProgrammShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>готовая</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="bg-[#111] py-3 rounded-2xl w-[49%]" onPress={() => { setExsShown(true) }}>
                        <Text className='font-pregular text-white text-[18px] text-center'>добавь</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}


              {current.key === '2' && (
                <View className="bg-[#111] py-3 rounded-2xl mb-2 w-full">
                  <View className="flex flex-row justify-between mb-1">
                    <Text className="text-white font-pbold text-[19px] mx-4 mb-2">подтягивания</Text>
                  </View>
                </View>
              )}

            </View>
          </View>

          {current?.track?.includes(5) && (
            <View className="absolute bottom-[192px] w-full flex justify-between flex-row px-4">
              <TouchableOpacity className="bg-[#111] w-[44.5vw] py-2 rounded-xl" onPress={() => { setForCount({ ...forCount, left: forCount.left + 1 }) }}>
                <Text className="text-white text-[24px] font-psemibold text-center">+1</Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-[#111] w-[44.5vw] py-2 rounded-xl" onPress={() => { setForCount({ ...forCount, right: forCount.right + 1 }) }}>
                <Text className="text-white text-[24px] font-psemibold text-center">+1</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isTracking ? (
            <TouchableOpacity onPress={handleStart} className="bg-primary p-4 rounded-xl absolute bottom-[120px] w-[91vw] mx-4">
              <Text className="text-white text-center text-[20px] font-psemibold">начать</Text>
            </TouchableOpacity>
          ) : (
            <View>
              {paused ? (
                <View className="absolute w-full bottom-[120px] flex flex-row px-4 justify-between">
                  <TouchableOpacity onPress={handlePause} className="bg-[#131313] p-4 rounded-xl w-[49%]">
                    <Text className="text-white text-center text-lg font-psemibold">продолжить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    handlePause();
                    handleFinish();
                  }} className="bg-primary p-4 rounded-xl w-[49%]">
                    <Text className="text-white text-center text-lg font-psemibold">закончить</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="absolute w-full bottom-[120px] flex flex-row px-4 justify-between">
                  <TouchableOpacity onPress={handlePause} className="bg-[#131313] p-4 rounded-xl w-[49%]">
                    <Text className="text-white text-center text-lg font-psemibold">пауза</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleFinish} className="bg-primary p-4 rounded-xl w-[49%]">
                    <Text className="text-white text-center text-lg font-psemibold">закончить</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {isSaving && (
            <View className="bg-[#000] absolute top-0 w-[100vw] h-[100vh] z-30 p-0 left-0 m-0">
              <ScrollView>
                <TouchableOpacity
                  onPress={() => {
                    setIsSaving(false);
                    setIsTracking(true);
                    handlePause();
                  }}
                  className="bg-[#111] rounded-2xl py-2 mx-4 mt-4">
                  <Text className="text-[18px] mx-4 text-white font-pregular text-center">👈 продолжить</Text>
                </TouchableOpacity>

                <Text className="text-[22px] mt-[16px] mx-4 text-white font-pbold">конец тренировки</Text>
                <Text className="text-[18px] font-pregular mx-4 text-[#838383] mb-2">время: {formatTime(timeElapsed)}</Text>

                {(timeElapsed / 60).toFixed() > 0 &&
                  (
                    <View className="flex flex-row mt-4 mx-4 justify-between">
                      <View className="bg-primary rounded-3xl pt-2 w-[49%]">
                        <Text className="text-[22px] text-white font-pbold mx-4">+{(timeElapsed / 60).toFixed()} <Text className="text-[18px]">монет</Text></Text>
                        <View className="flex flex-row bg-[#2870dd] justify-between px-4 py-2 mt-2 rounded-b-3xl">
                          {user.balance > 0 ? (
                            <Text className="text-[18px] text-white font-pbold">{user.balance}</Text>
                          ) : (
                            <Text className="text-[18px] text-white font-pbold">0</Text>
                          )}
                          <Text className="text-[18px] text-[#ffffff80] font-pbold">{'>>>'}</Text>
                          <Text className="text-[18px] text-white font-pbold">{user?.balance + parseInt((timeElapsed / 60).toFixed())}</Text>
                        </View>
                      </View>

                      <View
                        style={{ backgroundColor: rank[(user.rank - 1)].color }}
                        className={`rounded-3xl pt-2 w-[49%]`}>
                        <Text className="text-[22px] text-white font-pbold mx-4">+{(timeElapsed / 30).toFixed()} <Text className="text-[18px]">к уровню</Text></Text>
                        <View className="flex flex-row bg-[#00000030] justify-between px-4 py-2 mt-2 rounded-b-3xl">
                          {user.exp > 0 ? (
                            <Text className="text-[18px] text-white font-pbold">{user.exp}</Text>
                          ) : (
                            <Text className="text-[18px] text-white font-pbold">0</Text>
                          )}
                          <Text className="text-[18px] text-[#ffffff80] font-pbold">{'>>>'}</Text>
                          <Text className="text-[18px] text-white font-pbold">{user?.exp + parseInt((timeElapsed / 30).toFixed())}</Text>
                        </View>
                      </View>
                    </View>
                  )
                }

                <FormField
                  title={'описание'}
                  max={1000}
                  value={description}
                  handleChangeText={(e) => setDescription(e)}
                  multiline={true}
                  numberOfStrokes={4}
                  otherStyles={'mx-4 mt-4'}
                />
              </ScrollView>
              <View className="absolute bottom-[120px] w-full">
                <TouchableOpacity onPress={() => {
                  setShown(true);
                }} className="bg-[#222] p-4 rounded-xl mt-4 mx-4">
                  <Text className="text-white text-center text-[17px] font-psemibold">не сохранять</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmFinish} className="bg-primary p-4 rounded-xl mt-2 mx-4">
                  <Text className="text-white text-center text-[17px] font-psemibold">сохранить</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Animated.View className="bg-[#111111] w-[100vw] h-[400px] absolute z-10 left-0" style={{ bottom: fromBottom }}>
            <TouchableOpacity onPress={() => { setFromBottom(-400) }}>
              <Image
                source={icons.close}
                className="w-8 h-8 absolute right-4 top-4"
                tintColor={'white'}
              />

              <TouchableOpacity
                onPress={() => {
                  var newDoing = doing.filter(item => item !== exercise);
                  setDoing(newDoing);
                  setFromBottom(-400)
                }}
                className="flex flex-row items-center mx-4 mt-[52px]">
                <Image
                  source={icons.close}
                  className="w-6 h-6 mr-2 mt-1"
                  tintColor={'#ff535f'}
                />
                <Text className="text-[19px] font-pregular text-[#ff535f]">удалить упражнение</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { handleFavorite(exercise) }}
                className="flex flex-row items-center mx-4 mt-[16px]">
                <Image
                  source={icons.heart}
                  className="w-6 h-6 mr-2 mt-1"
                  tintColor={'#fff'}
                />
                {fav.includes(exercise) ? (
                  <Text className="text-[19px] font-pregular text-[#fff]">в избранные</Text>
                ) : (
                  <Text className="text-[19px] font-pregular text-[#fff]">из избранных</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View >
    </>
  );
};

export default Bookmark;