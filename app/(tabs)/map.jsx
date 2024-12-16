import React, { useState, useEffect } from 'react';
import { View, Button, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getAllRoutes, createRoute, getUserById, deleteRoute } from '../../lib/appwrite';
import haversine from "haversine";
import { useGlobalContext } from "../../context/GlobalProvider";
import { Dropdown } from 'react-native-element-dropdown';

const sports = [
  {
    title: 'бег',
    id: 0
  },
  {
    title: 'велосипед',
    id: 1
  }
];

const data = [
  { label: 'бег', value: '1' },
  { label: 'велосипед', value: '2' },
];

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [showingDetails, setShowingDetails] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [details, setDetails] = useState({});
  const [newRouteCoords, setNewRouteCoords] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const { user } = useGlobalContext();
  const [description] = useState('')

  const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

  const deleteRouteFront = (id) => {
    deleteRoute(id);
    setShowAlert(false);
    setShowingDetails(false);
  }

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied.');
        return null;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      } catch (error) {
        alert('Error in obtaining location: ' + error.message);
      }
    };

    requestLocationPermission();
  }, []);


  useEffect(() => {
    (async () => {
      const loadingRoutes = await getAllRoutes();
      if (loadingRoutes && loadingRoutes.length) {
        setRoutes(loadingRoutes);
      }
    })();
  }, []);


  function calculateTotalDistance(coordinates) {
    let totalDistance = 0;
    if (coordinates.length < 2) {
        return totalDistance;
    }
    for (let i = 0; i < coordinates.length - 1; i++) {
        totalDistance += haversine(coordinates[i], coordinates[i + 1]);
    }
    setDetails({...details, distance: totalDistance.toFixed(2)})
}



  const handleMapPress = (event) => {
    const newCoord = event.nativeEvent.coordinate;
    setNewRouteCoords([...newRouteCoords, newCoord]);

    if (newRouteCoords.length > 0) {
      const lastCoord = newRouteCoords[newRouteCoords.length - 1];
      const distance = haversine(lastCoord, newCoord, { unit: "meter" }) || 0;
      setTotalDistance(totalDistance + distance);
    }
  };

  const handleBackButton = () => {

    if (newRouteCoords.length === 0) {
      setCreatingRoute(false);
    }
    else {
    setNewRouteCoords(newRouteCoords.slice(0, -1));
    }
  }

  const showRouteDetails = (r) => {
    setDetails(r);
    setShowingDetails(true);
    calculateTotalDistance(r.coord)
  
    // Assuming `r` contains the property `userId`.
  
    const fetchUserDetails = async () => {
      // Fetch user details based on logged user ID from the `r` parameter.
      if (r && r.userId) {
        const loadingUser = await getUserById(r.userId);
        if (loadingUser) {
          setDetails((prevDetails) => ({ ...prevDetails, user: loadingUser }));
        }
      }
    };
  
    fetchUserDetails(); // Immediately fetch user details.
  };
  

  const handleNewRoute = () => {
    setCreatingRoute(true);
    setNewRouteCoords([]);
    setTotalDistance(0);
  };

  const handleFinishRoute = () => {
    setCreatingRoute(false);
    console.log("New Route Completed", newRouteCoords, (totalDistance/1000).toFixed(2), 'км');
    
    createRoute(user.$id, newRouteCoords, description);
  };

  const initialRegion = {
    latitude: location ? location.latitude : 53.902496,
    longitude: location ? location.longitude : 27.561481,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (location === null && errorMsg === null) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
        {showAlert && (
          <View className="absolute top-[30vh] bg-[#111] z-20 w-[90vw] right-[5vw] px-3 rounded-3xl py-3">
            <Text className="text-white font-pregular text-[16px]">вы хотите удалить маршрут?</Text>
            
            <View className="flex flex-row w-full justify-between mt-3">
              <TouchableOpacity className="bg-[#252525] px-3 py-2 rounded-xl w-[49%]" onPress={() => {deleteRouteFront(details?.$id)}}>
                <Text className="text-[16px] font-pregular text-white text-center">да</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-[#fff] px-3 py-2 rounded-xl w-[49%]"  onPress={() => {setShowAlert(false)}}>
                <Text className="text-[16px] font-pregular text-center">нет</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      <MapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followUserLocation={true}
        onPress={creatingRoute ? handleMapPress : () => {setShowingDetails(false)}}
      >
        {routes.length !== 0 && (
          routes.map((route, index) => (
            route.coord && route.coord.length >= 2 && (
              <Polyline
                key={index}
                coordinates={route.coord}
                strokeColor='black'
                strokeWidth={3}
                tappable
                onPress={() => showRouteDetails(route)}
              />
            )))
        )}        

        {newRouteCoords.length > 0 && (
          <Polyline
            coordinates={newRouteCoords}
            strokeColor='blue'
            strokeWidth={3}
          />
        )}
      </MapView>

        {creatingRoute ? (
          <View>
          <ScrollView className="absolute bottom-0 w-[100vw] h-[300px]">
            <View className="bg-[#111] mt-[100px] px-4 pb-[60px] pt-4">
      <Text className="font-pregular text-[17px] text-[#838383]">вид спорта</Text>
      <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={data}
          search
          maxHeight={500}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'выбери' : '...'}
          searchPlaceholder="поиск"
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            setValue(item.value);
            setIsFocus(false);
          }}
        />

      <Text className="font-pregular text-[17px] mb-2 mt-1 text-[#838383]">описание</Text>
        <TextInput
          editable
          multiline
          numberOfLines={10}
          maxLength={500}
          className="bg-[#252525] rounded-xl text-[16px] text-white py-2 px-4 font-pregular"
          >
        </TextInput>
      </View>
    </ScrollView>

<View className="flex flex-row justify-between mt-2 fixed bottom-[12px] mx-8 z-10">
<TouchableOpacity  
onPress={handleBackButton}
className="w-[20%] py-2 rounded-xl bg-[#fff]"
>
<Text className="text-center text-[16px] font-pregular">↩️</Text>
</TouchableOpacity>
<TouchableOpacity
style={[newRouteCoords.length < 2 ? styles.disabledButton : {}]}
onPress={handleFinishRoute}
className="w-[78%] py-2 rounded-xl bg-[#fff]"
disabled={newRouteCoords.length < 2}
>
<Text style={newRouteCoords.length < 2 ? {color: "#777"} : {color: '#000'}} className="text-white text-center text-[16px] font-pregular">готово</Text>
</TouchableOpacity>
</View>
</View>
        ) : showingDetails ? (
            <View className="h-[130px] w-[100vw] bg-[#111] px-4 py-2">
              <Text className="text-white text-[18px] font-psemibold">{details?.user?.name}</Text>
              <Text className="text-white text-[18px] font-psemibold">{details?.distance}км</Text>
              <Text className="text-[#838383] text-[16px] font-pregular">{details?.description}</Text>

              {user.$id === details.userId ? (
          <View className="flex flex-row absolute bottom-10 left-3">
              <TouchableOpacity onPress={() => {setShowAlert(true)}} className="bg-[#252525] px-4 py-1 rounded-xl absolute">
                <Text className="text-[#fff] font-pregular text-[16px]">удалить</Text>
              </TouchableOpacity>
          </View>
          ) : (
          <View>
          {/* Компоненты для других пользователей */}
         </View>
         )}

            </View>
          ) : (
            <ScrollView
            horizontal={true}
            style={styles.bottomScrollView}
            className="pb-2 pl-2"
          >
            <TouchableOpacity className="bg-[#111] rounded-[20px] px-4 flex justify-center mr-2" onPress={handleNewRoute}>
              <Text className="text-white font-pregular">новый маршрут +</Text>
            </TouchableOpacity>

            {sports.map(sport => (
              <TouchableOpacity key={sport.id} style={styles.sportButton}>
                <Text className="text-white font-pregular">{sport.title}</Text>
              </TouchableOpacity>
            ))}
      </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomScrollView: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    zIndex: 10,
  },
  sportButton: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
  },
  disabledButton: {
    backgroundColor: '#181818',
  },

  container: {
    backgroundColor: '#111',
    padding: 16,
  },
  dropdown: {
    height: 50,
    backgroundColor: '#252525',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  label: {
    position: 'absolute',
    backgroundColor: '#111',
    left: 22,
    bottom: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Installed-Regular'
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Installed-Regular'
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});