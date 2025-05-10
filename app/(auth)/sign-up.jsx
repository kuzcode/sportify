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
    email,
    password: "",
  });

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

  return (
    <SafeAreaView className="bg-light h-full">
      <ScrollView>
        <View
          className="w-full flex justify-center h-full px-4 mb-6"
          style={{
            minHeight: Dimensions.get("window").height - 100,
          }}
        >

          <Text className="text-2xl font-semibold mt-0 font-psemibold">
            Создайте аккаунт
          </Text>

          <FormField
            title="Имя"
            value={form.name}
            handleChangeText={(e) => setForm({ ...form, name: e })}
            otherStyles="mt-7"
          />

          <FormField
            title="Почта"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-4"
            keyboardType="email-address"
          />

          <FormField
            title="Пароль"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-4"
          />

          <CustomButton
            title="Войти"
            handlePress={next}
            containerStyles="mt-4"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg font-pregular">
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