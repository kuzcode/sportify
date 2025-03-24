import mapTemplate from '../map-template';
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Platform, TouchableOpacity, Text, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { createRoute, getAllRoutes, getUserById, getUserFriends, sendNotification } from '../../lib/appwrite';
import { icons } from '../../constants';
import { FormField } from '../../components';
import { useGlobalContext } from '../../context/GlobalProvider';

const App = () => {
  const { user } = useGlobalContext();
  const webRef = useRef(null);
  const [userCoords, setUserCoords] = useState({ latitude: 53, longitude: 27 });
  const [routes, setRoutes] = useState([]);
  const [formattedRoutes, setFormattedRoutes] = useState([]);
  const [points, setPoints] = useState([]);
  const [friends, setFriends] = useState([]);
  const [frList, setFrList] = useState([]);
  const [descr, setDescr] = useState('');
  const [locationSent, setLocationSent] = useState(false);
  const [routeClicked, setRouteClicked] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentRoute, setCurrentRoute] = useState({});
  const [currentUser, setCurrentUser] = useState({
    name: 'загрузка...'
  });
  const [creating, setCreating] = useState(false);
  const [filtresShown, setFiltresShown] = useState(false);
  const [filtres, setFiltres] = useState({
    type: 0,
    dis: 0,
    minDis: 0,
    maxDis: 99999,
  });
  const [al, setAl] = useState(false);

  const formatPoints = () => {
    const formattedPoints = points.map(point => {
      return {
        x: parseFloat(point[0]), // Форматируем x как дробное с 2 знаками после запятой
        y: parseFloat(point[1])  // Форматируем y как дробное с 2 знаками после запятой
      };
    });

    return formattedPoints;
  }

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (!locationSent && webRef.current) {
          setUserCoords({ latitude, longitude });
          webRef.current.injectJavaScript(`flyToUserLocation({"latitude": ${latitude}, "longitude": ${longitude}});`);
          setLocationSent(true); // Отправляем локацию только один раз
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    };

    fetchLocation();
  }, []);

  const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const lat1 = coords1[0];
    const lon1 = coords1[1];
    const lat2 = coords2[0];
    const lon2 = coords2[1];

    const R = 6371; // Радиус Земли в километрах
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Возвращаем расстояние в километрах
  };

  const calculateTotalDistance = (a) => {
    let totalDistance = 0;

    for (let i = 0; i < a.length - 1; i++) {
      totalDistance += haversineDistance(a[i], a[i + 1]);
    }

    return totalDistance;
  };

  const findMatchingId = (coordsList, objectsList) => {
    // Преобразуем первый список координат в массив объектов { x, y }
    const transformedCoords = [];

    for (let i = 0; i < coordsList.length; i += 2) {
      transformedCoords.push({
        x: parseFloat(coordsList[i]),
        y: parseFloat(coordsList[i + 1]),
      });
    }


    // Ищем совпадения в каждом объекте из второго списка
    for (const obj of objectsList) {
      const { coord } = obj; // Получаем список координат у объекта

      // Проверяем, все ли преобразованные координаты есть в списке coord
      const hasAllCoords = transformedCoords.every(({ x, y }) =>
        coord.some(c => c.x === x && c.y === y)
      );

      if (hasAllCoords) {
        return obj; // Возвращаем $id найденного объекта
      }
    }

    // Если не нашли совпадений
    return null;
  };


  const onMessage = (event) => {
    const message = event.nativeEvent.data; // Получаем сообщение из HTML
    var newCoords = message.split(',');
    if (creating === true) {
      if (newCoords[2] === 'map') {
        setPoints(prevPoints => [...prevPoints, [newCoords[0], newCoords[1]]]);
      }
    }
    else {
      if (newCoords[0] === 'route') {
        const filteredData = newCoords.splice(1);
        const neededObject = findMatchingId(filteredData, routes)
        var toCalc = [];
        console.log(filteredData)
        for (let i = 0; i < filteredData.length; i += 2) {
          if (i + 1 < filteredData.length) { // Проверяем, что следующий элемент существует
            toCalc.push([filteredData[i], filteredData[i + 1]]);
          }
        }
        setCurrentRoute(
          {
            description: neededObject.description,
            creator: neededObject.userId,
            id: neededObject.$id,
            points: filteredData,
            coord: toCalc,
          }
        )
        setRouteClicked(true);
      }
    }
  };

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const data = await getUserById(currentRoute.creator);
        setCurrentUser({
          name: data.documents[0].name,
          imageUrl: data.documents[0].imageUrl,
        })
      } catch (error) {
        console.error("Error fetching creator:", error);
      }
    };

    fetchCreator();
  }, [currentRoute]);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const data = await getUserFriends(user.$id);
        setFrList(data[0].friends)

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

  const getPointWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return 'точка';
    } else if ((count % 10 >= 2 && count % 10 <= 4) && (count % 100 < 12 || count % 100 > 14)) {
      return 'точки';
    } else {
      return 'точек';
    }
  };

  useEffect(() => {
    webRef.current.injectJavaScript(`drawRoutes([${JSON.stringify(points)}]);`);
  }, [points]);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const got = await getAllRoutes();
        setRoutes(got);
      } catch (error) {
        console.error('Error fetching routes: ', error);
      }
    }

    fetchRoutes();
  }, [])


  useEffect(() => {
    var result = [];
    var routesToDraw = [];  // Создаем массив для маршрутов, которые будут отрисованы

    routes?.map(route => {
      var thisroute = [];
      var pre = [];

      route.coord.map(coord => {
        pre.push([coord.x, coord.y]);
      });

      thisroute.push(pre);
      result.push(thisroute);

      var dis = calculateTotalDistance(thisroute[0]);

      if (dis > filtres.minDis && dis < filtres.maxDis) {
        routesToDraw.push(thisroute[0]);  // Добавляем маршрут в массив маршрутов для отрисовки
      }
      else {
        routesToDraw.splice(routesToDraw.indexOf(thisroute[0]))
        webRef.current.injectJavaScript(`removeRoute(${JSON.stringify(thisroute[0])});`);
      }
    });

    // После завершения итерации отрисовываем все маршруты за один раз
    if (routesToDraw.length > 0) {
      webRef.current.injectJavaScript(`drawRoutes(${JSON.stringify(routesToDraw)});`);
    }
  }, [routes, filtres]);


  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webRef}
        style={{ marginTop: -8, marginLeft: -8 }}
        originWhitelist={['*']}
        source={{ html: mapTemplate }}
        onMessage={onMessage}
      />

      {al && (
        <View className="absolute left-10 right-10 top-10 bg-black py-2 rounded-2xl">

          <View className="flex flex-row">
            <Text className="text-[#838383] font-pbold text-[18px] mx-4 mt-0">подсказка</Text>
            <TouchableOpacity
              onPress={() => { setAl(false) }}
              className="absolute right-2 top-0 bg-[#222] rounded-[12px] p-1">
              <Image
                source={icons.close}
                className="w-6 h-6"
                tintColor={'#fff'}
              />
            </TouchableOpacity>
          </View>

          <Text className="text-white font-pregular text-[16px] leading-[20px] mx-4 mt-0">для создания маршрута нажимай на нужные тебе точки на карте, затем напиши описание и нажми "сохранить". маршрут пройдёт верификацию (до 24ч) и будет опубликован</Text>
        </View>
      )}

      {creating && (
        <ScrollView className="absolute bottom-0 left-0 right-0 h-[30vh] bg-black z-20">
          <View className="flex flex-row absolute top-4 items-center justify-between left-4 right-4">
            <TouchableOpacity
              onPress={() => {
                setPoints(prevPoints => prevPoints.slice(0, -1));
              }}
              className="bg-white w-[15%] py-2 rounded-2xl">
              <Text className="text-[18px] font-pregular text-center">↩️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (points.length > 1) {
                  var newPoints = formatPoints();
                  var form = {
                    userId: user.$id,
                    coords: newPoints,
                    descr: descr
                  }

                  createRoute(form);
                  setCreating(false);
                  setAl(false);
                  setPoints([]);
                  setDescr('');
                }
              }}
              className={`${points.length > 1 ? 'bg-white' : 'bg-[#222]'} w-[70%] py-2 rounded-2xl`}>
              <Text className={`${points.length > 1 ? 'text-black' : 'text-[#838383]'} text-[18px] font-pregular text-center`}>сохранить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCreating(false);
                setAl(false);
              }}
              className="">
              <Image
                source={icons.close}
                className="w-7 h-7"
                tintColor={'#fff'}
              />
            </TouchableOpacity>
          </View>

          <Text className="text-[#838383] mt-[64px] text-[18px] font-pregular mx-4">
            {points.length} {getPointWord(points.length)}, {calculateTotalDistance(points).toFixed(2)}км
          </Text>

          <FormField
            otherStyles={'mx-4 mb-4'}
            title={'описание'}
            multiline={true}
            numberOfStrokes={4}
            max={2000}
            value={descr}
            handleChangeText={(e) => setDescr(e)}
          />
        </ScrollView>
      )}


      {sending && (
        <View className="left-[10vw] right-[10vw] bottom-[31vh] absolute bg-[#222] z-20 py-3 px-4 rounded-3xl">
          <View className="flex flex-row">
            <TouchableOpacity
              onPress={() => {
                setSending(false);
              }}
              className="bg-[#333] p-1 rounded-full absolute right-0 top-0"
            >
              <Image
                source={icons.close}
                tintColor={'#fff'}
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <Text className="text-white text-[18px] font-pregular">отправь другу</Text>
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
                      title: `маршрут`,
                      contentId: currentRoute.id,
                      type: 7,
                    };
                  });

                  nfs.forEach(form => {
                    sendNotification(form);
                  });

                  setSending(false);
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

      {routeClicked && (
        <ScrollView className="absolute bottom-0 left-0 right-0 h-[30vh] bg-black z-20">
          <View className="flex flex-row absolute top-4 items-center justify-between left-4 right-4">
            <TouchableOpacity
              onPress={() => {
                setSending(true);
              }}
              className={`bg-[#111] w-[82%] py-2 rounded-2xl`}>
              <Text
                className={`text-white text-[19px] font-pregular text-center`}>отправить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRouteClicked(false);
              }}
              className="w-[15%] bg-[#111] flex justify-center items-center rounded-2xl py-[10px]">
              <Image
                source={icons.close}
                className="w-6 h-6"
                tintColor={'#fff'}
              />
            </TouchableOpacity>
          </View>

          <Text className="text-[#838383] mt-[64px] text-[18px] font-pregular mx-4">маршрут</Text>
          <Text className="text-[#fff] mt-0 text-[18px] font-pregular mx-4">
            {currentRoute.points.length / 2} {getPointWord(currentRoute.points.length / 2)}, {(calculateTotalDistance(currentRoute.coord)).toFixed(2)}км
          </Text>

          <Text className="text-[#838383] mt-4 text-[18px] font-pregular mx-4">автор</Text>
          <View className="flex flex-row mt-1 items-center">
            <Image
              source={{ uri: currentUser.imageUrl }}
              className="w-7 h-7 bg-[#111] rounded-full ml-4 mr-2"
            />
            <Text className="text-white text-[18px] font-pregular">{currentUser.name}</Text>
          </View>

          <Text className="text-[#838383] mt-4 text-[18px] font-pregular mx-4">описание</Text>
          <Text className="text-white text-[18px] font-pregular mx-4">{currentRoute.description}</Text>

          <View className="mt-[5vh]"></View>
        </ScrollView>
      )}

      {filtresShown && (
        <ScrollView className="absolute bottom-0 left-0 right-0 h-[30vh] bg-black z-20">
          <View className="flex flex-row absolute top-4 items-center justify-between left-4 right-4">
            <Text className="text-[#fff] text-[19px] font-pregular">
              выбери фильтры
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFiltresShown(false);
              }}
              className="">
              <Image
                source={icons.close}
                className="w-7 h-7"
                tintColor={'#fff'}
              />
            </TouchableOpacity>
          </View>

          <Text className="text-[#838383] mt-[50px] text-[19px] font-pbold mx-4">
            вид спорта
          </Text>

          <View className="flex flex-row mx-4">
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, type: 0 }) }}
              className={`${filtres.type === 0 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.type === 0 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>все</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, type: 1 }) }}
              className={`${filtres.type === 1 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.type === 1 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>бег</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, type: 2 }) }}
              className={`${filtres.type === 2 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.type === 2 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>велик</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-[#838383] mt-[16px] text-[19px] font-pbold mx-4">
            длина
          </Text>

          <ScrollView className="flex flex-row mx-4"
            horizontal={true}
          >
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, dis: 0, minDis: 0, maxDis: 99999 }) }}
              className={`${filtres.dis === 0 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.dis === 0 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>все</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, dis: 1, minDis: 0, maxDis: 5 }) }}
              className={`${filtres.dis === 1 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.dis === 1 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>до 5км</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, dis: 2, minDis: 5, maxDis: 10 }) }}
              className={`${filtres.dis === 2 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.dis === 2 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>5-10км</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, dis: 3, minDis: 10, maxDis: 20 }) }}
              className={`${filtres.dis === 3 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.dis === 3 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>10-20км</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, dis: 4, minDis: 20, maxDis: 50 }) }}
              className={`${filtres.dis === 4 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.dis === 4 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>20-50км</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFiltres({ ...filtres, dis: 5, minDis: 50, maxDis: 99999 }) }}
              className={`${filtres.dis === 5 ? 'bg-white' : 'bg-[#111]'} px-4 py-1 rounded-2xl mt-2 mr-2`}>
              <Text className={`${filtres.dis === 5 ? 'text-black' : 'text-white'} text-[18px] font-pregular text-center`}>больше 50км</Text>
            </TouchableOpacity>
          </ScrollView>
        </ScrollView>
      )}

      <View className="flex flex-row absolute bottom-8 left-2 z-10">
        <TouchableOpacity
          onPress={() => {
            setCreating(true);
            setAl(true);
          }}
          className="bg-[#111] rounded-3xl pt-1 pb-2 px-4">
          <Text className="text-[17px] text-white font-pregular">+ маршрут</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setFiltresShown(true);
          }}
          className="bg-[#111] rounded-3xl pt-1 pb-2 px-4 ml-2">
          <Text className="text-[17px] text-white font-pregular">фильтры</Text>
        </TouchableOpacity>
      </View>

      <View className="flex flex-row absolute bottom-0 right-0">
        <TouchableOpacity
          onPress={() => {
            setCreating(true);
            setAl(true);
          }}
          className="bg-primary pt-0 pb-0 w-full">
          <Text className="text-[18px] text-white font-pbold text-center">атлет карта</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;
