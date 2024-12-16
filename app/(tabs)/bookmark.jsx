import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useGlobalContext } from '../../context/GlobalProvider';
import * as Location from 'expo-location';
import { types } from '../../constants/types';
import { saveCompleted } from '../../lib/appwrite';
import PushNotification from 'react-native-push-notification';

const Bookmark = () => {
  const { user } = useGlobalContext();
  const filteredList = types.filter(item => user?.sports?.includes(item.key));
  const [current, setCurrent] = useState(filteredList[0]);
  const [isTracking, setIsTracking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lastPosition, setLastPosition] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [count, setCount] = useState(5);
  const [counterShown, setCounterShown] = useState(false);
  const [forCount, setForCount] = useState({
    left: 0,
    right: 0
  });
  const watchSubscriptionRef = useRef(null);

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
    
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isTracking && !paused) {
        timerRef.current = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
    } else if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null; // Clear reference
    }
    
    // Cleanup function on unmount
    return () => clearInterval(timerRef.current);
}, [isTracking, paused]); // re-run effect if either isTracking or paused changes




  useEffect(() => {
    let watchSubscription;

    const startTracking = async () => {
      await Location.requestForegroundPermissionsAsync();
      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          timeInterval: 1000
        },
        position => {
          const { latitude, longitude } = position.coords;

          if (lastPosition) {
            const newDistance = calculateDistance(lastPosition, { latitude, longitude });
            setDistance(prevDistance => prevDistance + newDistance);
          }
          setCoordinates(coords => [...coords, { latitude, longitude }]);
          setLastPosition({ latitude, longitude });
        }
      );
    };

    if (isTracking) {
      startTracking();
    }

    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [isTracking, lastPosition]);

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
          return 0;
        } else {
          Vibration.vibrate(100);
          return prevCount - 1;
        }
      });
    }, 1000);
  };

  const handlePause = () => {
    setPaused(!paused);
  };

  const handleFinish = () => {
    setIsSaving(true);
    setIsTracking(false);
    setPaused(false);
  };

  const handleConfirmFinish = () => {
    saveCompleted(user.$id, parseInt(current.key), timeElapsed, parseFloat(distance).toFixed(2))
    setIsTracking(false);
    setTimeElapsed(0);
    setForCount({
      left: 0,
      right: 0
    })
    setDistance(0);
    setIsSaving(false);
  };


  const handleConfirmCancel = () => {
    setIsTracking(false);
    setTimeElapsed(0);
    setForCount({
      left: 0,
      right: 0
    })
    setDistance(0);
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
            trackedData.push({ label: trackLabels[trackId], value: '0', meas: 'км/ч'});
            break;
          case 4:
            trackedData.push({ label: trackLabels[trackId], value: '0', meas: 'км/ч'});
            break;
          case 5:
            trackedData.push({ label: trackLabels[trackId], value: `${forCount.left}:${forCount.right}`});
            break;
          case 6:
            trackedData.push({ label: trackLabels[trackId], value: `100м`});
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
    {counterShown && (
      <View className="bg-[#000] w-[100vw] h-[100vh] absolute top-0 z-30">
        <Text className="text-[80px] mt-[40vh] text-center font-psemibold text-white">{count}</Text>
          <Text className="text-[24px] mt-[6px] text-center font-pregular text-white">light weight, baby!</Text>
      </View>
    )}
    <View className="bg-[#000] p-0 h-[100vh] pt-10">
      <View contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="b-4 h-[100vh]">
        <View>
          {//<LinearGradient className="w-[60px] h-10 absolute right-0 z-10"start={{x: 0, y: 0}} end={{x: 0.9, y: 0}}colors={['#fff0', '#000']}/>
}
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
          <View className="bg-primary rounded-lg mb-4 mx-4 py-1">
          <Text className="text-[#fff] font-pbold text-[37px] text-center">{formatTime(timeElapsed)}</Text>
          </View>


          <View className="px-4 flex flex-row flex-wrap w-[100vw] justify-between">
          {trackedData.map((data, index) => (
            <View key={index} className="w-[43.75vw] bg-[#111] m-1 py-1 px-2 rounded-xl">
              <Text className="text-[#838383] font-pregular text-[17px]">{data.label}</Text>
              <Text className="text-white text-[30px] font-psemibold">{data.value}<Text className="text-[17px] font-pregular text-[#838383]">{data?.meas}</Text></Text>
            </View>
          ))}
          </View>
        </View>

        {current?.track?.includes(5) && (
          <View className="absolute bottom-[192px] w-full flex justify-between flex-row px-4">
            <TouchableOpacity className="bg-[#111] w-[44.5vw] py-2 rounded-xl" onPress={() => {setForCount({...forCount, left: forCount.left + 1})}}>
              <Text className="text-white text-[24px] font-psemibold text-center">+1</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-[#111] w-[44.5vw] py-2 rounded-xl" onPress={() => {setForCount({...forCount, right: forCount.right + 1})}}>
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
              <View className="absolute w-full bottom-[120px]">
                <TouchableOpacity onPress={handlePause} className="bg-green-500 p-4 rounded-lg mx-4">
                  <Text className="text-white text-center text-lg font-psemibold">продолжить</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFinish} className="bg-primary p-4 mt-2 rounded-lg mx-4">
                  <Text className="text-white text-center text-lg font-psemibold">закончить</Text>
                </TouchableOpacity>
            </View>
            ) : (
              <View className="absolute w-full bottom-[120px]">
                <TouchableOpacity onPress={handlePause} className="bg-[#131313] p-4 rounded-xl mx-4">
                  <Text className="text-white text-center text-lg font-psemibold">пауза</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFinish} className="bg-primary p-4 mt-2 rounded-xl mx-4">
                  <Text className="text-white text-center text-lg font-psemibold">закончить</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {isSaving && (
          <View className="bg-[#000] absolute top-0 w-[100vw] h-[100vh] z-30 p-0 left-0 m-0">
            <Text className="text-[22px] mt-[56px] mx-4 text-white font-pbold">конец тренировки</Text>
            <Text className="text-[18px] font-pregular mx-4 text-[#838383] mb-2">не разбив яиц, омлет не приготовишь</Text>

            <MapView
              style={{ height: 200, marginTop: 10 }}
              initialRegion={{
                latitude: coordinates.length > 0 ? coordinates[0].latitude : 0,
                longitude: coordinates.length > 0 ? coordinates[0].longitude : 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Polyline coordinates={coordinates} strokeColor="#000" strokeWidth={3} />
            </MapView>

            <View className="absolute bottom-[120px] w-full">
            <TouchableOpacity onPress={handleConfirmCancel} className="bg-[#222] p-4 rounded-xl mt-4 mx-4">
              <Text className="text-white text-center text-[17px] font-psemibold">отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirmFinish} className="bg-primary p-4 rounded-xl mt-2 mx-4">
              <Text className="text-white text-center text-[17px] font-psemibold">сохранить</Text>
            </TouchableOpacity>
              </View>
          </View>
        )}
      </View>
    </View>
    </>
  );
};

export default Bookmark;