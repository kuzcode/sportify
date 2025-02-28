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
import { getAllUsers, getNews } from "../../lib/appwrite";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import useAppwrite from "../../lib/useAppwrite";
import { useNavigation } from '@react-navigation/native';

const Create = () => {
    const [users, setUsers] = useState([])
    const navigation = useNavigation();

    useEffect(() => {
        async function fetchUsers() {
            try {
                const got = await getAllUsers();
                setUsers(got)
            } catch (error) {
                console.error('Error fetching users: ', error);
            }
        }

        fetchUsers();
    }, [])

    return (
        <ScrollView className="bg-[#000] pt-10 px-4">
            <Text className="text-white font-pbold text-[21px]">люди</Text>
            <Text className="text-[#838383] font-pregular text-[20px] mb-4">здесь ты можешь познакомиться или найти уже знакомого</Text>

            <View className="flex flex-row justify-between">
                <TouchableOpacity onPress={() => { router.push('/additional/gymbro') }} className="w-[48%]">
                    <View>
                        <Image
                            source={{ uri: 'https://athleteblr.netlify.app/more/help/image.jpg' }}
                            className="w-full h-[100px] rounded-3xl"
                        />
                        <View className="w-full h-[100px] absolute bg-[#00000070]"></View>
                    </View>
                    <Text className="absolute font-pbold text-white text-[20px] mx-4 my-2">найти gymbro</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { router.push('/additional/co') }} className="w-[48%]">
                    <View>
                        <Image
                            source={{ uri: 'https://athleteblr.netlify.app/more/help/image.jpg' }}
                            className="w-full h-[100px] rounded-3xl"
                        />
                        <View className="w-full h-[100px] absolute bg-[#00000070]"></View>
                    </View>
                    <Text className="absolute font-pbold text-white text-[20px] mx-4 my-2">совместные тренировки</Text>
                </TouchableOpacity>
            </View>

            {users
                .sort((a, b) => b.balance - a.balance)
                .map(us => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('otherProfile', us)} // переходим на экран Bookmark
                        className="bg-[#111] rounded-3xl flex flex-row mt-4">
                        <Image
                            source={{ uri: us.imageUrl }}
                            className="w-[90px] h-[90px] rounded-l-3xl"
                        />
                        <View>
                            <View className="flex flex-row flex-wrap pr-[100px] mt-2">
                                <Text className="text-[20px] ml-4 font-pbold text-white">{us.name}</Text>
                            </View>
                            <Text className="text-[#838383] text-[18px] font-pregular mx-4">@{us.username}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

            <View className="mt-[120px]">
            </View>
        </ScrollView>
    )
}

export default Create;
