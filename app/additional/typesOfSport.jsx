import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FormField } from "../../components";
import { router } from "expo-router";
import { updateUser } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { types } from "../../constants/types";

const TypesOfSport = () => {
    const [sports, setSports] = useState([])
    const { user } = useGlobalContext();

    useEffect(() => {
        if (user?.sports.length !== 0) {
            setSports(user.sports)
        }
    }, [user]);

    
    const toggleSportInForm = (type) => {
        if (sports.includes(type.key)) {
            // Если вид спорта уже выбран, убираем его из списка
            setSports(sports.filter(sport => sport !== type.key));
        } else {
            // Если вид спорта не выбран, добавляем его в список
            setSports([...sports, type.key]);
        }
    };
    

    return (
    <View className='top-0 left-0 bg-[#111] absolute z-10 w-[100vw] h-full px-4'>
      <Text className='text-white font-pbold text-[22px] mt-10'>выберите, какими видами спорта вы увлечены</Text>
        <FormField placeholder='поиск' onChangeText={text => setSearchText(text)} />
        <View className="flex flex-row flex-wrap pt-4">
        {types.map(type =>
      <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
          toggleSportInForm(type)
      }} className="px-[18px] py-[6px] rounded-2xl mr-[6px] mb-[6px]" style={{ backgroundColor: sports.includes(type.key) ? 'white' : '#252525' }} key={type.key}>
        <Text className="font-pbold text-[16px]" style={{ color: sports.includes(type.key) ? '#333' : '#f5f5f5' }}>{type.title}</Text>
      </TouchableOpacity>
    )}
    </View>


    <TouchableOpacity className="absolute w-full bottom-[20px] bg-primary mx-4 py-4 rounded-2xl" onPress={() => {
        if (sports !== user?.sports) {
            const form = {
                id: user.$id,
                name: user?.name,
                bio: user?.bio,
                username: user?.username,
                sports: sports
            }
            updateUser(form);
            router.push('/profile')
        }
    }}>
        <Text className="font-pregular text-white text-[18px] text-center">{sports === user?.sports ? ('отмена') : ('сохранить')}</Text>
    </TouchableOpacity>
    </View>
    )
}

export default TypesOfSport