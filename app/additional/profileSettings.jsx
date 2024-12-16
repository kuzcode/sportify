import { View, Text, Image, TouchableOpacity } from "react-native";
import { useState } from "react";
import { updateUser } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { FormField } from "../../components";
import * as DocumentPicker from "expo-document-picker";


const ProfileSettings = () => {
  const { user } = useGlobalContext();
  const [form, setForm] = useState({
        avatar: user?.imageUrl,
        name: user?.name,
        bio: user?.bio,
        username: user?.username,
        id: user?.$id,
    })


  const openPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type:["image/png", "image/jpg", "image/jpeg"]});
        setForm({
          ...form,
          avatar: result.assets[0],
        });
  };

  const checkSave = () => {
    if (form.name.length > 24) {
      alert('максимум 24 символа в имени');
    }
    else if (form.name.length < 3) {
      alert('минимум 3 символа в имени');
    }
    if (form.username.length > 24) {
      alert('максимум 24 символа в никнейме');
    }
    else if (form.username.length < 1) {
      alert('минимум 1 символ в никнейме');
    }
    else if (form.username.length < 1) {
      alert('минимум 1 символ в никнейме');
    }
    else if (form.username.length > 1024) {
      alert('максимум 1024 символа в описании');
    }
    else {
      updateUser(form);
    }
  }


    return(
        <View className="bg-[#111] w-full h-full px-4">    
        <TouchableOpacity onPress={() => openPicker()} className="w-[140px] h-[140px] mx-auto mt-[80px] rounded-full mb-4 flex justify-center items-center">
          <Image
            source={{ uri: form.avatar || 'https://pixlr.com/ru/image-generator/' }} 
            className="w-[100%] h-[100%] rounded-full"
            resizeMode="cover"
          />
        </TouchableOpacity>

          <FormField
            title="имя"
            max={24}
            value={form.name}
            handleChangeText={(e) => setForm({ ...form, name: e })}
            otherStyles="mt-7"
          />
          <FormField
            title="никнейм"
            max={24}
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-7"
          />
          <FormField
            title="описание"
            max={1024}
            value={form.bio}
            handleChangeText={(e) => setForm({ ...form, bio: e })}
            otherStyles="mt-7"
          />

            <TouchableOpacity onPress={() => {checkSave()}} className="bg-white py-3 absolute bottom-4 w-full rounded-xl ml-4">
                <Text className="text-center font-pregular text-[18px]">сохранить</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ProfileSettings;