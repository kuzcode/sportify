import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, Dimensions, Image, PanResponder, StyleSheet, Vibration } from "react-native";

import { useState, useEffect } from "react";

import { useGlobalContext } from "../../context/GlobalProvider";
import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { startMeal } from "../../lib/appwrite";
import { types } from "../../constants/types";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { colors, meal } from "../../constants/types";
import { FormField } from "../../components";
import { Dropdown } from "react-native-element-dropdown";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { getUserMeal } from "../../lib/appwrite";
import AsyncStorage from '@react-native-async-storage/async-storage';
import icons from "../../constants";


const Meal = () => {
  const { user } = useGlobalContext();
  const [mealForm, setMealForm] = useState({
  });


  const fetchMealData = async () => {
    try {
      const data = await getUserMeal();
      setMealForm(data);
    } catch (err) {
      setError(err.message);
    }
  };


  useEffect(() => {
    fetchMealData();
  }, []);

  async function addMeal(name, calories, grams) {
    try {
      const newMeal = { name, calories, grams };

      mealForm.eaten.push(newMeal); // Добавляем новое блюдо в массив eaten

      await AsyncStorage.setItem('mealData', JSON.stringify(mealForm)); // Сохраняем обновленные данные обратно в AsyncStorage

      return mealForm; // Возвращаем сохраненные данные
    } catch (error) {
      throw new Error('Ошибка при сохранении: ' + error.message);
    }
  }

  return (
    <ScrollView className="bg-black w-full h-[100vh]">
      <LinearGradient colors={['#ff0844', '#ffb199']} className="h-[270px] w-full">
        <Text className="font-pbold text-white text-[38px] text-center mt-[100px]">
          {mealForm ? mealForm.goal : '0000'}
        </Text>
      </LinearGradient>
      <LinearGradient colors={['#fff0', '#000']} className="h-[30px] z-10 w-full mt-[-30px]">
      </LinearGradient>

      <TouchableOpacity activeOpacity={0.8} onPress={() => {
        addMeal(
          'банан', 220, 100
        )
      }} className="bg-[#fff] relative m-2 top-[0vw] mx-auto w-[83%] pt-[15px] pb-[19px] rounded-[21px] z-30">
        <View className="flex flex-row items-center justify-center">
          <Text className="text-center font-pregular text-[18px]">добавить еду +</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default Meal;