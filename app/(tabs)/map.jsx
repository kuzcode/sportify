import { ScrollView, Text, TouchableOpacity, View, Dimensions, Image, StyleSheet, Vibration, ActivityIndicator, RefreshControl } from "react-native";
import { icons } from "../../constants";
import { getPeople, updateUser, getMasterModels } from "../../lib/appwrite";
import { useEffect, useState, useRef } from "react";
import { FormField } from "../../components";

const { width } = Dimensions.get('window');

const Home = () => {
  const [people, setPeople] = useState([]);
  const [details, setDetails] = useState({
    visible: 0,
    activeTab: 'active' // 'active', 'completed', 'all'
  });
  const [toRefresh, setToRefresh] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [masterModels, setMasterModels] = useState([]);
  const [archivedModels, setArchivedModels] = useState([]);
  const horizontalScrollRef = useRef(null);

  useEffect(() => {
    async function getPeopleFunc() {
      try {
        const data = await getPeople();
        // Добавляем количество моделей для каждого пользователя
        const peopleWithModels = await Promise.all(data.map(async (person) => {
          const models = await getMasterModels(person.$id, false);
          return {
            ...person,
            modelsCount: models.length
          };
        }));
        setPeople(peopleWithModels);
      }
      catch (e) {
        console.log(e)
      }
    }

    getPeopleFunc();
  }, [toRefresh])

  useEffect(() => {
    async function getModelsFunc() {
      if (details.visible === 1 && details.$id) {
        try {
          const [activeModels, archivedModels] = await Promise.all([
            getMasterModels(details.$id, false),
            getMasterModels(details.$id, true)
          ]);
          setMasterModels(activeModels);
          setArchivedModels(archivedModels);
        } catch (e) {
          console.log('Ошибка при получении моделей:', e);
        }
      }
    }

    getModelsFunc();
  }, [details.visible, details.$id]);

  const archiveModel = async (model) => {
    try {
      await updateModel({
        ...model,
        archived: true
      });
      // Обновляем списки моделей
      const [activeModels, archivedModels] = await Promise.all([
        getMasterModels(details.$id, false),
        getMasterModels(details.$id, true)
      ]);
      setMasterModels(activeModels);
      setArchivedModels(archivedModels);
    } catch (e) {
      console.log('Ошибка при архивации модели:', e);
    }
  };

  const unarchiveModel = async (model) => {
    try {
      await updateModel({
        ...model,
        archived: false
      });
      // Обновляем списки моделей
      const [activeModels, archivedModels] = await Promise.all([
        getMasterModels(details.$id, false),
        getMasterModels(details.$id, true)
      ]);
      setMasterModels(activeModels);
      setArchivedModels(archivedModels);
    } catch (e) {
      console.log('Ошибка при разархивации модели:', e);
    }
  };

  const getIconSource = (iconIndex) => {
    switch (iconIndex) {
      case 0: return icons.alert;
      case 1: return icons.measure;
      case 2: return icons.triangular;
      case 3: return icons.warranty;
      case 4: return icons.blade;
      case 5: return icons.edge;
      case 6: return icons.drill;
      case 7: return icons.tool;
      case 8: return icons.spray;
      case 9: return icons.tape;
      case 10: return icons.container;
      case 11: return icons.screwdriver;
      case 12: return icons.shuffle;
      default: return null;
    }
  };

  const getIconCount = (iconIndex) => {
    return masterModels.filter(model => {
      const master = model.masters?.find(m => m.id === details.$id);
      return master && master.icon === iconIndex && model.status === 1;
    }).length;
  };

  if (details.visible === 1) {
    return (
      <ScrollView className="bg-light h-[90vh] p-4 pt-10">
        <View className="flex flex-row justify-between items-center mb-4">
          <FormField
            title="Имя"
            value={details.name}
            handleChangeText={(e) => setDetails({ ...details, name: e })}
            otherStyles="w-[60%]"
          />
          <FormField
            title="Баланс"
            value={String(details.balance)}
            handleChangeText={(e) => setDetails({ ...details, balance: Number(e) })}
            otherStyles="w-[35%]"
          />
        </View>

        <View className="flex flex-row justify-between mb-4">
          <TouchableOpacity
            onPress={() => setDetails({ ...details, activeTab: 'active' })}
            className={`px-4 py-2 rounded-xl ${details.activeTab === 'active' ? 'bg-white' : 'bg-transparent'}`}
          >
            <Text className={`font-pregular ${details.activeTab === 'active' ? 'text-black' : 'text-gray-500'}`}>Активные</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDetails({ ...details, activeTab: 'completed' })}
            className={`px-4 py-2 rounded-xl ${details.activeTab === 'completed' ? 'bg-white' : 'bg-transparent'}`}
          >
            <Text className={`font-pregular ${details.activeTab === 'completed' ? 'text-black' : 'text-gray-500'}`}>Завершенные</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDetails({ ...details, activeTab: 'all' })}
            className={`px-4 py-2 rounded-xl ${details.activeTab === 'all' ? 'bg-white' : 'bg-transparent'}`}
          >
            <Text className={`font-pregular ${details.activeTab === 'all' ? 'text-black' : 'text-gray-500'}`}>Все</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="font-pbold text-[20px] mb-4">Активные модели</Text>
          {masterModels?.map((model, index) => (
            <View key={index} className="mb-4">
              <View className="flex flex-row justify-between items-center">
                <Text className="font-pregular text-[18px]">{model.title}</Text>
                <Text className="font-pregular text-[18px]">
                  {model.masters?.find(m => m.id === details.$id)?.cost || 0}₽
                </Text>
                <Image
                  source={getIconSource(model.masters?.find(m => m.id === details.$id)?.icon)}
                  className="w-[28px] h-[28px]"
                />
              </View>
            </View>
          ))}
          <Text className="font-pregular text-[18px] mt-4">Итого: {masterModels?.reduce((sum, model) => {
            const master = model.masters?.find(m => m.id === details.$id);
            return sum + (master?.cost || 0);
          }, 0) || 0}₽</Text>
        </View>

        {archivedModels?.length > 0 && (
          <View className="bg-white rounded-2xl p-4">
            <Text className="font-pbold text-[20px] mb-4">Архив</Text>
            {archivedModels.map((model, index) => (
              <View key={index} className="mb-4">
                <View className="flex flex-row justify-between items-center">
                  <Text className="font-pregular text-[18px]">{model.title}</Text>
                  <Text className="font-pregular text-[18px]">
                    {model.masters?.find(m => m.id === details.$id)?.cost || 0}₽
                  </Text>
                  <Image
                    source={getIconSource(model.masters?.find(m => m.id === details.$id)?.icon)}
                    className="w-[28px] h-[28px]"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="w-full h-[2px] bg-white mt-4"></View>
        <Text className="text-[20px] font-pbold my-2">Рабочие процессы</Text>
        <View className="w-full h-[2px] bg-white"></View>

        <View className="w-full h-[2px] bg-white mt-4"></View>
        <Text className="text-[20px] font-pbold my-2">Финансовые операции</Text>
        <View className="w-full h-[2px] bg-white"></View>

        {details.cashouts?.map((csh, index) =>
          <View key={index} className="flex flex-row justify-between my-2">
            <Text className='text-[20px] font-pregular'>{new Date(csh.date).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}</Text>
            <Text className={`text-[20px] font-pregular ${csh.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{csh.amount > 0 && '+'}{csh.amount}₽</Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-primary p-4 rounded-2xl mt-4"
          onPress={() => {
            const currentBalance = details.balance || 0;
            if (currentBalance > 0) {
              const newCashout = {
                date: new Date().toISOString(),
                amount: -currentBalance
              };

              setDetails({
                ...details,
                balance: 0,
                cashouts: [...(details.cashouts || []), newCashout]
              });
            }
          }}
        >
          <Text className="text-white font-pregular text-[20px] text-center">Выдать с баланса</Text>
        </TouchableOpacity>

        <View className=" my-10 rounded-xl flex flex-row justify-around left-0 right-0 py-4 bg-white">
          <TouchableOpacity
            onPress={() => { setDetails({ visible: 0 }) }}
          >
            <Image
              className='w-10 h-10'
              source={icons.home}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              console.log('Отправляемые данные:', details);
              try {
                await updateUser(details);
                console.log('Данные успешно сохранены');
                setToRefresh(toRefresh + 1);
              } catch (error) {
                console.error('Ошибка при сохранении:', error);
              }
            }}
          >
            <Image
              className='w-10 h-10'
              source={icons.tick}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  } else {
    return (
      <ScrollView className="bg-light h-full"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setToRefresh(toRefresh + 1)
            }}
          />
        }
      >
        <View className="py-10 px-4">
          <View className="flex flex-row justify-between mb-2">
            <Text className="font-pbold text-[22px]">Сотрудники</Text>
          </View>

          {people.map(person =>
            <TouchableOpacity
              className="p-4 bg-white my-2 rounded-2xl"
              key={person.$id}
              onPress={() => {
                setDetails({
                  visible: 1,
                  activeTab: 'active',
                  ...person
                })
              }}
            >
              <View className="flex flex-row justify-between">
                <Text className="font-pbold text-[18px]">{person.name} <Text className="text-gray-500 font-pregular">({person.modelsCount})</Text></Text>
                <Text className="font-pbold text-[18px]">{person.balance}₽</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }
}

export default Home;