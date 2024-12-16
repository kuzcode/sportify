import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View  } from "react-native";
import { useGlobalContext } from "../../context/GlobalProvider";
import useAppwrite from "../../lib/useAppwrite";
import { getUserTrackers } from "../../lib/appwrite";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/types";

const Trackers = () => {
  const { user } = useGlobalContext();
  const { data: trackers } = useAppwrite(() => getUserTrackers(user?.$id));
  const navigation = useNavigation();

    return (
        <ScrollView className="bg-black h-full w-full">
            <TouchableOpacity onPress={() => {router.push('/trackers')}}>
            <Text className="text-[21px] font-pbold relative text-[#fff] text-center mb-4 mt-10">привычки</Text>
            </TouchableOpacity>
            <View className="mx-auto">
            {trackers.map(track => {
             let content = {};
             if (track.type === 0) { //  You need to define what type 0 represents
               content = { a: 'ошибка', b: 'попробуйте перезагрузить' }; // Or handle it appropriately
             } else if (track.type === 1) {
               content = { a: `меньше ${track.name}`, b: `${track.done}/${track.goal} дней` };
             } else {
               content = { a: 'Unknown Type', b: '' }; // Handle unknown types gracefully
             }
           
           
             return (
               <TouchableOpacity
                 key={track.$id}
                 onPress={() => navigation.navigate('additional/track', { track })} // Removed / from the route
                 className="relative w-[92vw] h-[165px] bg-[#161616] rounded-3xl overflow-hidden mb-4"
               >
                 <LinearGradient
                   colors={colors[track.color]}
                   className="relative w-[92vw] h-[165px] bg-[#161616] px-4 py-2 rounded-3xl overflow-hidden mb-4"
                 >
                   <Text className="text-white font-pbold text-[20px]">{content.a}</Text>
                   <Text className="text-[#ffffff83] font-pregular text-[20px]">{content.b}</Text>
           
                   {track.type === 1 && (
                     <View className="absolute flex flex-row bottom-3 px-4 w-[90vw] justify-between">
                       <TouchableOpacity className="w-[38.5%] py-[5px] bg-[#ffffff20] border-[1px] border-[#ffffff25] rounded-xl">
                         <Text className="font-pregular text-white text-center text-[15px]">сорвался</Text>
                       </TouchableOpacity>
                       <TouchableOpacity className="w-[58.5%] py-[5px] bg-[#ffffff20] border-[1px] border-[#ffffff25] rounded-xl">
                         <Text className="font-pregular text-white text-center text-[15px]">держусь</Text>
                       </TouchableOpacity>
                     </View>
                   )}
                 </LinearGradient>
               </TouchableOpacity>
            )})}
        </View>
        </ScrollView>
    )
}

export default Trackers;