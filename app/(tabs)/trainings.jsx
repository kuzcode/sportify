import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, TouchableOpacity, Text, ScrollView, View } from "react-native";

import { sporticons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getTrainingsForYou, getCurrentUser } from "../../lib/appwrite";

const Train = () => {
  const { data: trainings } = useAppwrite(() => getTrainingsForYou(['0', '1']));

  const { data: user, isLoading: trainingsLoading } = useAppwrite(getCurrentUser);
  
  const [updatedSports, setUpdatedSports] = useState([]);

  useEffect(() => {
    if (user) { // Проверяем, пришли ли данные пользователя
      let sports = user.sports || []; // Если sports не определен, используем пустой массив

      const types = [
        { title: 'Все', key: 'all' },
        { title: 'Бег', key: '0' },
        { title: 'Качалка', key: '1' },
        { title: 'Велосипед', key: '2' },
        { title: 'Плавание', key: '3' },
        { title: 'Теннис', key: '4' },
        { title: 'Баскетбол', key: '5' }
      ];

      // Преобразование списка в объект
      let updated = sports.map(key => {
        let sport = types.find(sport => sport.key === key);
        return sport || { title: 'Неизвестный', key: key };
      });

      updated.unshift(types[0]);

      // Заполнение до 5 элементов
      if (updated.length < 5) {
        let existingKeys = new Set(updated.map(sport => sport.key));
        types.forEach(sport => {
          if (!existingKeys.has(sport.key) && updated.length < 5) {
            updated.push(sport);
          }
        });
      }

      setUpdatedSports(updated); // Обновляем состояние с новым массивом
    }
  }, [user]); // Срабатывает при изменении данных пользователя

  const [current, setCurrent] = useState(
    {
      title: 'Все',
      key: 'all'
    }
    )  

  const filteredTrainings = current.key === 'all' 
  ? trainings
  : trainings.filter(train => train.kind === current.key)

  return (
    <SafeAreaView className="bg-white h-full">
      <Text className="font-pbold text-[27px] mx-4 mt-2">Тренировки</Text>
    <View>
    <ScrollView horizontal={true} className="flex px-3">
        {updatedSports.map(type =>
          <TouchableOpacity className="flex rounded-xl py-1 px-4 mx-1"
          onPress={() => {setCurrent({title: type.title, key: type.key})}}
          activeOpacity={0.9}
          style={{
            backgroundColor: current.key == type.key ?  '#30d158' : '#f3f3f3',
          }}
          > 
            <Text className="flex text-[16px] font-psemibold"
            style={{
              color: current.key == type.key ?  '#fff' : '#676767',
            }}
            >{type.title}</Text>
          </TouchableOpacity>
        )}
    </ScrollView>
    </View>

    <TouchableOpacity className="bg-[#f3f3f3] mx-4 mt-4 h-[120px] rounded-3xl flex justify-center"
    activeOpacity={0.85}
    >
        <Text className="font-psemibold text-lg text-[#000] text-center">Создать свою +</Text>
    </TouchableOpacity>

    <Text className="font-pbold text-[27px] mx-4 mt-2">Примите участие</Text>
    

  {filteredTrainings.length == 0 ? (
    <Text className="text-center text-[#676767] text-lg mx-4 mt-4">Тренировок пока нет :(</Text>
  ) : (

  filteredTrainings.map(train => {
    // Создаем объект даты из строки
    const date = new Date(train.date);
    
    // Создаем массив с месяцами
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    const types = ['Бег 🏃', 'Качалка 🏋️‍♂️', 'Велоспед', 'Плавание'];
    const iconstypes = ['running', 'gym', 'cycling', 'swimming'];
    
    // Получаем нужные значения
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    // Форматируем дату
    const formattedDate = `${day} ${month}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const formattedType = types[Number(train.kind)];
    const formattedIcon = iconstypes[Number(train.kind)];

    return (
      <View key={train.id} className="mx-4 h-[120px] bg-[#f3f3f3] px-4 py-2 rounded-2xl overflow-hidden mb-4">
        <Text className="font-pbold text-xl">{train.title}</Text>
        <Text className="font-pregular text-xl text-[#676767]">{formattedDate}</Text>
        <Text className="font-pregular text-xl text-[#676767]">{formattedType}</Text>
        <Image
          source={sporticons[formattedIcon]}
          className="absolute right-[-5px] top-[-5px] w-[130px] h-[130px] overflow-hidden"
        />
      </View>
    );
})
)}
</SafeAreaView>
  );
};

export default Train;