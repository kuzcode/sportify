import { useState } from "react";
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
} from "react-native";

import { icons } from "../../constants";
import { createVideoPost } from "../../lib/appwrite";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const Create = () => {
  const [communities, setCommunities] = useState([])

  return (
    <ScrollView className="bg-[#000] pt-10 px-4">
      <Text className="text-white font-pbold text-[27px] mb-3">клуб</Text>

      <View className="bg-[#3c87ff] mx-auto w-[91.545vw] h-[53vw] py-3 rounded-[10px] overflow-hidden">
        <Text className="text-white font-pregular mx-4 text-[#ffffff83] text-[24px] mt-1 leading-[24px]">клубная{`\n`}карта участника</Text>
        <Text className="text-white font-pbold text-[27vw] text-center absolute bottom-[-40px] left-[-20px] right-[-20px] text-nowrap">athlete</Text>
        <View className="mx-4 mt-2 absolute w-[83.545vw] bottom-4">
          {//<View style={styles.outerBlock}>
            //<View style={[styles.innerBlock, { width: blockWidth }]} />
            //<Text className="left-0 bottom-[3px] text-[18px] w-full text-center absolute font-pregular text-[#fff]">{percentage}%</Text>
          //</View>
}
        </View>
      </View>

      {communities.length === 0 ? (
        <TouchableOpacity className="bg-[#111] mt-4 rounded-3xl flex flex-row px-[16px] py-[16px] items-center">
          <Image 
          className="w-10 h-10 mr-[16px]"
          source={icons.neww}
          tintColor={'#fff'}
          />
          <View>
          <Text className="text-white text-[22px] font-psemibold">вступи в сообщество</Text>
          <Text className="text-[#828282] text-[18px] font-pregular">или создай своё</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View>
          {communities.map(comm =>
            <TouchableOpacity key={comm}>

            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  )
}

export default Create;
