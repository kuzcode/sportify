import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import { useGlobalContext } from "../../context/GlobalProvider";
import useAppwrite from "../../lib/useAppwrite";
import { getTopUsersByTime, getUsersByIds, getTopUsersByDis } from "../../lib/appwrite";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/types";
import { useEffect, useState } from "react";

const Card = () => {
    const [{ user }, setUser] = useState(useGlobalContext());
    const [leaders, setLeaders] = useState([]);
    const [disLeaders, setDisLeaders] = useState([]);
    const [names, setNames] = useState([]);
    const [tab, setTab] = useState(0);

    const formatTime = time => {
        const hours = String(Math.floor(time / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
        const seconds = String(time % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Получаем лидеров
                const leadersByTime = await getTopUsersByTime();
                setLeaders(leadersByTime);

                // Извлекаем уникальные userId
                const userIdsList = getUserIds(leadersByTime);
                if (userIdsList.length === 0) return; // Защита от пустого массива

                // Получаем пользователей по ID
                const users = await getUsersByIds(userIdsList);
                setNames(users);

                // Объединяем лидеров с именами и обновляем state
                const updatedLeaders = addNamesToObjects(leadersByTime, users);
                setLeaders(updatedLeaders);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        fetchData();
    }, [user]); // Пустой массив зависимостей означает, что useEffect выполнится только один раз при монтировании компонента


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Получаем лидеров
                const leadersByDis = await getTopUsersByDis();
                setDisLeaders(leadersByDis);

                // Извлекаем уникальные userId
                const userIdsList = getUserIds(leadersByDis);
                if (userIdsList.length === 0) return; // Защита от пустого массива

                // Получаем пользователей по ID
                const users = await getUsersByIds(userIdsList);
                setNames(users);

                // Объединяем лидеров с именами и обновляем state
                const updatedLeaders = addNamesToObjects(leadersByDis, users);
                setDisLeaders(updatedLeaders);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        fetchData();
    }, [user]); // Пустой массив зависимостей означает, что useEffect выполнится только один раз при монтировании компонента


    const getUserIds = (data) => {
        const userIds = data.map(item => item.userId);
        return Array.from(new Set(userIds));
    };

    const addNamesToObjects = (objects, names) => {
        return objects.map((obj, index) => ({
            ...obj,
            name: names[index] || 'имя неизвестно',
        }));
    };


    return (
        <ScrollView className="bg-black h-[100vh] w-full">
            <Text className="text-[23px] font-pbold relative mx-4 text-[#fff] mt-[32px] text-center">доска лидеров</Text>
            <Text className="text-[20px] font-pregular relative mx-4 text-[#838383] text-center">за месяц</Text>

            <ScrollView
                className="flex flex-row pr-4"
                horizontal={true}
            >
                <TouchableOpacity onPress={() => { setTab(0) }} className={`${tab === 0 ? 'bg-white' : 'bg-[#111]'} py-2 px-4 rounded-2xl ml-4 mt-4`}>
                    <Text className={`${tab === 0 ? 'text-black' : 'text-white'} text-[20px] font-pregular relative text-center`}>по времени</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setTab(1) }} className={`${tab === 1 ? 'bg-white' : 'bg-[#111]'} py-2 px-4 rounded-2xl ml-4 mt-4`}>
                    <Text className={`${tab === 1 ? 'text-black' : 'text-white'} text-[20px] font-pregular relative text-center`}>пробежал</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setTab(2) }} className={`${tab === 2 ? 'bg-white' : 'bg-[#111]'} py-2 px-4 rounded-2xl ml-4 mt-4`}>
                    <Text className={`${tab === 2 ? 'text-black' : 'text-white'} text-[20px] font-pregular relative text-center`}>в зале</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setTab(3) }} className={`${tab === 2 ? 'bg-white' : 'bg-[#111]'} py-2 px-4 rounded-2xl ml-4 mt-4`}>
                    <Text className={`${tab === 3 ? 'text-black' : 'text-white'} text-[20px] font-pregular relative text-center`}>набрал</Text>
                </TouchableOpacity>
            </ScrollView>

            {tab === 0 && (
                <View>
                    {leaders.map((leader, index) => {
                        if (index === 0) {
                            return (
                                <View key={leader} className="bg-[#ffb61832] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#ffdc6a]">1</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#fff2c0a0]">{formatTime(leader.totalTime)}</Text>
                                    </View>
                                </View>
                            );
                        }
                        else if (index === 1) {
                            return (
                                <View key={leader} className="bg-[#f3f9ff32] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#fafcffd3]">2</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#e2f4ffa0]">{formatTime(leader.totalTime)}</Text>
                                    </View>
                                </View>
                            );
                        }
                        else if (index === 2) {
                            return (
                                <View key={leader} className="bg-[#ff875e32] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#ffaba8ce]">3</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#f9cec9a0]">{formatTime(leader.totalTime)}</Text>
                                    </View>
                                </View>
                            );
                        }
                        else {
                            return (
                                <View key={leader} className="bg-[#111] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#838383]">{index + 1}</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#838383]">{formatTime(leader.totalTime)}</Text>
                                    </View>
                                </View>
                            );
                        }
                    })}
                </View>
            )}

            {tab === 1 && (
                <View>
                    {disLeaders.map((leader, index) => {
                        if (index === 0) {
                            return (
                                <View key={leader} className="bg-[#ffb61832] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#ffdc6a]">1</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#fff2c0a0]">{(leader.totalDis).toFixed(2)}км</Text>
                                    </View>
                                </View>
                            );
                        }
                        else if (index === 1) {
                            return (
                                <View key={leader} className="bg-[#f3f9ff32] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#fafcffd3]">2</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#e2f4ffa0]">{(leader.totalDis).toFixed(2)}км</Text>
                                    </View>
                                </View>
                            );
                        }
                        else if (index === 2) {
                            return (
                                <View key={leader} className="bg-[#ff875e32] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#ffaba8ce]">3</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#f9cec9a0]">{(leader.totalDis).toFixed(2)}км</Text>
                                    </View>
                                </View>
                            );
                        }
                        else {
                            return (
                                <View key={leader} className="bg-[#111] py-4 mx-4 mt-4 rounded-3xl flex flex-row items-center">
                                    <Text className="text-[30px] font-pbold relative ml-4 text-[#838383]">{index + 1}</Text>
                                    <View>
                                        <Text className="text-[21px] font-pbold relative mx-4 text-[#fff]">{leader.name}</Text>
                                        <Text className="text-[19px] font-pregular relative mx-4 text-[#838383]">{(leader.totalDis).toFixed(2)}км</Text>
                                    </View>
                                </View>
                            );
                        }
                    })}
                </View>
            )}
        </ScrollView>
    )
}

export default Card;