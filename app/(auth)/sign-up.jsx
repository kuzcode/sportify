import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Alert, TouchableOpacity, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { images } from "../../constants";
import { createUser } from "../../lib/appwrite";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import { types } from "../../constants/types";

const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext();

  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    bio: "",
    sports: [],
    avatar: null,
    weight: 0
  });

  const selectImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpg", "image/jpeg"],
        copyToCacheDirectory: true, // Опция для кэширования файла
      });

      setForm({
        ...form,
        avatar: result.assets[0],
      });

    } catch (error) {
      console.error('Ошибка при открытии выборщика:', error);
    }
  };



  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await createUser(form);
      setUser(result);
      setIsLogged(true);

      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSportInForm = (type) => {
    setForm(prevForm => {
      const isSportInArray = prevForm.sports.includes(type.key);
      return {
        ...prevForm,
        sports: isSportInArray
          ? prevForm.sports.filter(sport => sport !== type.key) // удаляем
          : [...prevForm.sports, type.key] // добавляем
      };
    });
  };



  const [visible, setVisible] = useState(0);


  const next = () => {
    if (form.username === "" || form.email === "" || form.password === "" || form.name === "") {
      alert("а вот и нет! заполни все поля!");
    }
    else if (/^[A-Za-z0-9]*$/.test(form.username)) {
      setVisible(visible + 1);
    }
    else {
      alert("никнейм может содержать только буквы английского алфавита и цифры");
    }
  }

  const [searchText, setSearchText] = useState('');

  const filteredTypes = types
    .filter(type => type.title.toLowerCase().startsWith(searchText.toLowerCase()))
    .concat(
      types.filter(type => !type.title.toLowerCase().startsWith(searchText.toLowerCase()) &&
        type.title.toLowerCase().includes(searchText.toLowerCase()))
    );

  return (
    <SafeAreaView className="bg-[#111] h-full">
      <ScrollView>
        <View
          className="w-full flex justify-center h-full px-4 mb-6"
          style={{
            minHeight: Dimensions.get("window").height - 100,
          }}
        >

          {visible == 1 && (
            <View className='top-0 left-0 bg-[#111] absolute z-10 w-[100vw] h-full px-4'>
              <Text className='text-white font-pbold text-[22px] mt-10'>выбери, какими видами спорта вы увлечены</Text>

              <FormField placeholder='поиск' onChangeText={text => setSearchText(text)} />
              <View className="flex flex-row flex-wrap pt-4">
                {filteredTypes.map(type =>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      toggleSportInForm(type)
                    }} className="px-[18px] py-[6px] rounded-2xl mr-[6px] mb-[6px]" style={{ backgroundColor: form.sports.includes(type.key) ? 'white' : '#252525' }} key={type.key}>
                    <Text className="font-pbold text-[16px]" style={{ color: form.sports.includes(type.key) ? '#333' : '#f5f5f5' }}>{type.title}</Text>
                  </TouchableOpacity>
                )}
              </View>


              <TouchableOpacity className="absolute w-full bottom-[20px] bg-primary mx-4 py-4 rounded-2xl" onPress={next}>
                <Text className="font-pregular text-white text-[18px] text-center">{form.sports.length == 0 ? ('пропустить') : ('дальше')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {visible == 2 && (
            <View className='top-0 left-0 bg-[#111] absolute z-10 w-[100vw] h-full px-4'>
              <Text className='text-white font-pbold text-[22px] mt-10'>дополнительная информация</Text>
              <TouchableOpacity onPress={selectImage} className="bg-[#252525] h-[160px] w-[160px] mx-auto mt-4 rounded-full">
                <Image
                  source={{ uri: form?.avatar?.uri }}
                  className="w-[160px] h-[160px] rounded-full"
                />
              </TouchableOpacity>

              <FormField
                title="описание"
                value={form.bio}
                handleChangeText={(e) => setForm({ ...form, bio: e })}
                otherStyles="mt-4"
                multiline={true}
                max={1024}
                numberOfStrokes={10}
              />
              <TouchableOpacity className="absolute w-full bottom-[20px] bg-primary mx-4 py-4 rounded-2xl" onPress={submit}>
                <Text className="font-pregular text-white text-[18px] text-center">{form.avatar ? ('пропустить') : ('войти в приложение')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-white text-2xl font-semibold mt-0 font-psemibold">
            создайте аккаунт
          </Text>

          <FormField
            title="имя"
            value={form.name}
            handleChangeText={(e) => setForm({ ...form, name: e })}
            otherStyles="mt-7"
          />

          <FormField
            title="никнейм"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-4"
          />

          <FormField
            title="почта"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-4"
            keyboardType="email-address"
          />

          <FormField
            title="пароль"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-4"
          />

          <CustomButton
            title="дальше"
            handlePress={next}
            containerStyles="mt-4"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-[#838383] font-pregular">
              у вас есть аккаунт?
            </Text>
            <Link
              href="/sign-in"
              className="text-lg font-psemibold text-[#3c87ff]"
            >
              войдите
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;