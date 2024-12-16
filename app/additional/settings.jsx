import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { signOut } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const Settings = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.push("/sign-up");
  };

  const links = [
    {
      title: 'профиль',
      des: 'публичность · аватар',
      link: 'additional/profileSettings'
    },
    {
      title: 'виды спорта',
      des: 'список видов спорта',
      link: 'additional/typesOfSport'
    },
    {
      title: 'приложение',
      des: 'дизайн · общие настроки',
      link: 'additional/appSettings'
    }
  ]
  return (
    <SafeAreaView className="px-4 my-6 bg-[#000] h-full">
      <Text className="text-2xl text-white font-psemibold">настройки</Text>

    {links.map(link => 
      <TouchableOpacity key={link.title} className="bg-[#111] pt-2 pb-3 px-4 rounded-2xl mt-2"
      onPress={() => {router.push(`/${link.link}`)}}
      >
        <Text className="text-[#fff] font-pregular text-[19px]">{link.title}</Text>
        <Text className="text-[#838383] font-pregular text-[15px]">{link.des}</Text>
      </TouchableOpacity>
    )}

<TouchableOpacity className="bg-[#2A0404] absolute bottom-10 w-full left-4 right-4 pt-2 pb-3 px-4 rounded-2xl mt-2"
      onPress={logout}
      >
        <Text className="text-[#FF7E7E] font-pregular text-[18px] text-center">Выйти</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Settings;


