import { ScrollView, Text, TouchableOpacity, View, Dimensions, Image, StyleSheet, Vibration, ActivityIndicator } from "react-native";
import { icons } from "../../constants";
import { getPeople } from "../../lib/appwrite";
import { useEffect, useState } from "react";

const Home = () => {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    async function getPeopleFunc() {
      try {
        const data = await getPeople();
        setPeople(data);
      }
      catch (e) {
        console.log(e)
      }
    }

    getPeopleFunc();
  }, [])

  return (
    <ScrollView className="bg-light h-full w-full py-10 px-4">
      <View className="flex flex-row justify-between">
        <Text className="font-pbold text-[20px]">Сотрудники</Text>

      </View>

      {people.map(person =>
        <TouchableOpacity className="p-4 bg-white my-4 rounded-2xl"
          key={person}
        >
          <View className="flex flex-row justify-between">
            <Text className="font-pbold text-[18px]">{person.name} <Text className="text-gray-500 font-pregular">(2)</Text></Text>
            <Text className="font-pbold text-[18px]">{person.balance}₽</Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

export default Home;