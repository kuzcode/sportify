import { useState, useEffect } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    View,
    Text,
    Alert,
    Image,
    TouchableOpacity,
    ScrollView,
    Linking,
} from "react-native";
import { icons } from "../../constants";
import { getUserNotifications, readAllNotifs, getCommunityById, getUserById, addToFriends, deleteNotification } from "../../lib/appwrite";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import useAppwrite from "../../lib/useAppwrite";
import { useNavigation } from '@react-navigation/native';

const Create = () => {
    const { user } = useGlobalContext();
    const [notifications, setNotifications] = useState([])

    const getName = async (id, sentBy) => {
        var res = ''

        if (sentBy === 0) {
            const recieved = await getUserById(id)
            res = recieved.documents[0]
        }
        else if (sentBy === 1) {
            res = await getCommunityById(id)
        }

        return res.name
    }

    useEffect(() => {
        async function fetchNotifs() {
            try {
                const got = await getUserNotifications(user.$id);

                // Предположим, что getName - это функция, которая принимает id и возвращает имя
                const notificationsWithNames = await Promise.all(got.map(async (notification) => {
                    const name = await getName(notification.sentBy, notification.sentById); // Получаем имя по sentById
                    return {
                        ...notification, // Копируем остальные поля уведомления
                        name: name // Добавляем поле name
                    };
                }));

                setNotifications(notificationsWithNames);

                readAllNotifs(user.$id)
            } catch (error) {
                console.error('Error fetching notifications: ', error);
            }
        }

        fetchNotifs();
    }, []);




    return (
        <ScrollView className="bg-[#000] pt-10 px-4">
            <Text className="text-white font-pbold text-[21px]">уведомления</Text>

            {notifications.filter(item => !item.isRead).length > 0 && (
                <View>
                    <Text className="text-[#838383] text-[18px] font-pregular mt-4">непрочитанные</Text>
                    {notifications.filter(item => !item.isRead).map(item =>
                        <View className="bg-[#111] px-4 py-3 rounded-3xl mt-4">
                            <Text className="text-white text-[20px] font-pbold">{item.title}</Text>
                            {item.type === 0 && (
                                <Text className="text-[#838383] text-[18px] font-pregular">{item.content}</Text>
                            )}

                            {item.type === 1 && (
                                <TouchableOpacity>
                                    <Text className="text-[#838383] text-[18px] font-pregular mt-4">пользователь <Text className="text-primary">{item.name}</Text> отправил заявку в друзья</Text>

                                    <View className="flex flex-row justify-between mt-4 mb-2">
                                        <TouchableOpacity
                                            onPress={() => {
                                                deleteNotification(item.$id);
                                                router.push('/home')
                                            }}
                                            className="bg-[#222] py-2 rounded-xl w-[48%]">
                                            <Text className="text-[18px] text-white font-pregular text-center">отклонить</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                addToFriends(user.$id, item.sentById);
                                                deleteNotification(item.$id)
                                                router.push('/home')
                                            }}
                                            className="bg-white  py-2 rounded-xl w-[48%]">
                                            <Text className="text-[18px] font-pregular text-center">принять</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {item.sentBy === 1 && (
                                <TouchableOpacity className="border-t-2 border-t-[#222] mt-2">
                                    <Text className="text-[#838383] text-[18px] font-pregular">от сообщества <Text className="text-primary">{item.name}</Text></Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            )}

            {notifications.filter(item => item.isRead).length > 0 && (
                <View>
                    <Text className="text-[#838383] text-[18px] font-pregular mt-4">старые</Text>
                    {notifications.filter(item => item.isRead).map(item =>
                        <View className="bg-[#111] px-4 py-3 rounded-3xl mt-4">
                            <Text className="text-white text-[20px] font-pbold">{item.title}</Text>
                            {item.type === 0 && (
                                <Text className="text-[#838383] text-[18px] font-pregular">{item.content}</Text>
                            )}

                            {item.type === 1 && (
                                <TouchableOpacity>
                                    <Text className="text-[#838383] text-[18px] font-pregular mt-4">пользователь <Text className="text-primary">{item.name}</Text> отправил заявку в друзья</Text>

                                    <View className="flex flex-row justify-between mt-4 mb-2">
                                        <TouchableOpacity
                                            onPress={() => {
                                                deleteNotification(item.$id);
                                                router.push('/home')
                                            }}
                                            className="bg-[#222] py-2 rounded-xl w-[48%]">
                                            <Text className="text-[18px] text-white font-pregular text-center">отклонить</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                addToFriends(user.$id, item.sentById);
                                                deleteNotification(item.$id)
                                                router.push('/home')
                                            }}
                                            className="bg-white  py-2 rounded-xl w-[48%]">
                                            <Text className="text-[18px] font-pregular text-center">принять</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {item.sentBy === 1 && (
                                <TouchableOpacity className="border-t-2 border-t-[#222] mt-2">
                                    <Text className="text-[#838383] text-[18px] font-pregular">от сообщества <Text className="text-primary">{item.name}</Text></Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    )
}

export default Create;
