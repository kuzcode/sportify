import { ScrollView, Text, TouchableOpacity, View, Linking, Image, StyleSheet, TextInput, RefreshControl, Alert, Dimensions } from "react-native";
import { icons } from "../../constants";
import { getMasters, getOrders, updateModel, updateOrder, updateTracker, updateUser } from "../../lib/appwrite";
import { useEffect, useState, useRef } from "react";
import RNPickerSelect from "react-native-picker-select";
import { FormField } from "../../components";

const Home = () => {
  const [orders, setOrders] = useState([]);
  const [masters, setMasters] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [prorabs, setProrabs] = useState([]);
  const [toRefresh, setToRefresh] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+7977');
  const [inputValue, setInputValue] = useState('');
  const [details, setDetails] = useState({
    visible: 0
  });
  const [iconUpdateTimer, setIconUpdateTimer] = useState(null);
  const horizontalScrollRef = useRef(null);
  const width = Dimensions.get('window').width;

  const bgs = [
    { title: 'Кр.', bg: '#b61900' },
    { title: 'Син.', bg: '#2362fa' },
    { title: 'Кор.', bg: '#7a3904' },
    { title: 'Зел.', bg: '#039900' },
    { title: 'Сер.', bg: '#484a55' },
  ]

  useEffect(() => {
    async function getOrdersFunc() {
      try {
        const data = await getOrders();
        if (!data || data.length === 0) {
          console.log('Нет доступных заказов');
          setOrders([]);
          return;
        }

        const updatedOrders = data.map(order => {
          const endDate = new Date(order.endDate);
          const today = new Date();
          const timeDiff = endDate - today;
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          return {
            ...order,
            visible: 1,
            toEnd: daysDiff >= 0 ? daysDiff : 0
          };
        }).sort((a, b) => a.toEnd - b.toEnd);
        setOrders(updatedOrders);
      }
      catch (e) {
        console.error('Ошибка при загрузке заказов:', e);
        Alert.alert('Ошибка', 'Не удалось загрузить заказы. Пожалуйста, проверьте подключение к интернету и попробуйте снова.');
        setOrders([]);
      }
    }

    getOrdersFunc();
  }, [toRefresh]);

  useEffect(() => {
    async function getMastersFunc() {
      try {
        const [mastersData, designersData, prorabsData] = await Promise.all([
          getMasters(1),
          getMasters(2),
          getMasters(3)
        ]);
        console.log('Загруженные дизайнеры:', designersData);
        console.log('Загруженные прорабы:', prorabsData);

        // Проверяем структуру данных
        if (designersData && designersData.length > 0) {
          console.log('Пример данных дизайнера:', designersData[0]);
        }
        if (prorabsData && prorabsData.length > 0) {
          console.log('Пример данных прораба:', prorabsData[0]);
        }

        setMasters(mastersData);
        setDesigners(designersData);
        setProrabs(prorabsData);
      }
      catch (e) {
        console.error('Ошибка при загрузке мастеров:', e);
      }
    }

    getMastersFunc();
  }, [toRefresh]);

  // Добавим эффект для отслеживания изменений в списках
  useEffect(() => {
    console.log('Текущие дизайнеры в состоянии:', designers);
    console.log('Текущие прорабы в состоянии:', prorabs);
  }, [designers, prorabs]);

  const handleIconUpdate = (orderIndex, modIndex, iconIndex, newStatus, order) => {
    const newIcons = [...orders[orderIndex].models[modIndex].icons];
    newIcons[iconIndex] = newStatus;
    const updatedModule = { ...orders[orderIndex].models[modIndex], icons: newIcons };
    const updatedModules = [...orders[orderIndex].models];
    updatedModules[modIndex] = updatedModule;
    const updatedOrders = [...orders];
    updatedOrders[orderIndex].models = updatedModules;
    setOrders(updatedOrders);

    // Очищаем предыдущий таймер, если он есть
    if (iconUpdateTimer) {
      clearTimeout(iconUpdateTimer);
    }

    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      updateOrder(
        order
      )
    }, 1000);

    setIconUpdateTimer(timer);
  };

  const handleOperationUpdate = (iconIndex, newStatus) => {
    // Обновляем статус в details
    const updatedOperations = [...(details.operations || Array(13).fill(0))];
    updatedOperations[iconIndex] = newStatus;
    setDetails({ ...details, operations: updatedOperations });

    // Находим соответствующий модуль в orders и обновляем его
    const orderIndex = orders.findIndex(order => order.$id === details.order.$id);
    if (orderIndex !== -1) {
      const modIndex = orders[orderIndex].models.findIndex(mod => mod.id === details.id);
      if (modIndex !== -1) {
        const newIcons = [...orders[orderIndex].models[modIndex].icons];
        newIcons[iconIndex] = newStatus;
        const updatedModule = { ...orders[orderIndex].models[modIndex], icons: newIcons };
        const updatedModules = [...orders[orderIndex].models];
        updatedModules[modIndex] = updatedModule;
        const updatedOrders = [...orders];
        updatedOrders[orderIndex].models = updatedModules;
        setOrders(updatedOrders);
      }
    }
  };

  const archiveModel = async (model) => {
    try {
      // Обновляем статус модели
      await updateModel({
        ...model,
        archived: true
      });

      // Обновляем балансы всех мастеров
      if (model.masters && model.masters.length > 0) {
        for (const master of model.masters) {
          if (master.id && master.cost) {
            // Получаем текущие данные мастера
            const masterData = await getMasters(1);
            const currentMaster = masterData.find(m => m.$id === master.id);

            if (currentMaster) {
              // Обновляем баланс мастера
              await updateUser({
                $id: master.id,
                name: currentMaster.name,
                balance: (currentMaster.balance || 0) + Number(master.cost),
                cashouts: [...currentMaster.cashouts, {
                  amount: Number(master.cost),
                  date: new Date()
                }],
              });
            }
          }
        }
      }

      setToRefresh(toRefresh + 1);
    } catch (e) {
      console.log('Ошибка при архивации модели:', e);
    }
  };

  if (details.visible === 1) {
    return (
      <View className="bg-light h-[100vh]">
        <ScrollView className="bg-light h-[90vh] p-4 pt-10">
          <View className="flex flex-row justify-between mb-4">
            <TextInput
              className="bg-white border-2 border-[#ccd6dd] py-1 flex-1 mr-4 rounded-xl text-center font-pbold text-[20px]"
              value={details.title}
              onChangeText={(e) => { setDetails({ ...details, title: e }) }}
            />

            <TextInput
              className="bg-white border-2 border-[#ccd6dd] py-1 px-4 rounded-xl text-center text-[20px] font-pbold"
              value={String(details.toEnd)}
              onChangeText={(e) => {
                const days = Number(e);
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + days);
                setDetails({
                  ...details,
                  toEnd: days,
                  endDate: endDate.toISOString()
                })
              }}
            />

            <TouchableOpacity>
              <Image
                source={icons.whatsapp}
                className="w-8 h-8 ml-4"
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-end mb-4">
            <Text className="font-pregular text-[20px] mr-2">Заказчик</Text>

            <View className="flex-1">
              <TextInput
                className="flex-1 font-pregular text-base border-2 border-[#ccd6dd] py-0 px-4 rounded-xl"
                value={details?.customer?.name}
                placeholder={'Имя'}
                placeholderTextColor="#7B7B8B"
                onChangeText={(e) => setDetails(prevDetails => ({
                  ...prevDetails,
                  customer: { ...prevDetails.customer, name: e }
                }))}
              />
              <TextInput
                className="flex-1 font-pregular text-base border-2 border-[#ccd6dd] py-0 px-4 rounded-xl mt-1"
                value={details?.customer?.phone}
                placeholder={'Номер телефона'}
                placeholderTextColor="#7B7B8B"
                onChangeText={(e) => setDetails(prevDetails => ({
                  ...prevDetails,
                  customer: { ...prevDetails.customer, phone: e }
                }))}
              />
            </View>

            <TouchableOpacity
              onPress={() => { Linking.openURL(`tel:${details?.customer?.phone}`); }}
            >
              <Image
                source={icons.phone}
                className="w-8 h-8 ml-2"
              />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <View className="flex-row items-end mb-2">
              <Text className="font-pregular text-[20px] mr-2">Дизайнер</Text>

              <View className="flex-1">
                <View className="border-2 border-[#ccd6dd] rounded-2xl mb-2 h-8 flex-1">
                  <RNPickerSelect
                    onValueChange={(value) => {
                      console.log('Выбран дизайнер:', value);
                      const selectedDesigner = designers.find(m => m.$id === value);
                      console.log('Найденный дизайнер:', selectedDesigner);
                      if (selectedDesigner) {
                        setDetails({
                          ...details,
                          designer: {
                            name: selectedDesigner.name,
                            designerId: selectedDesigner.$id,
                            phoneNumber: selectedDesigner.phoneNumber
                          }
                        });
                      }
                    }}
                    value={details.designer?.designerId}
                    items={designers.map(m => ({
                      value: m.$id,
                      label: m.name,
                      key: m.$id
                    }))}
                    placeholder={{ label: 'Выберите дизайнера', value: null }}
                    style={{
                      inputIOS: { paddingVertical: 10, width: '100%' },
                      inputAndroid: { width: '100%' }
                    }}
                  />
                </View>

                <TextInput
                  className="flex-1 font-pregular text-base border-2 border-[#ccd6dd] py-0 px-4 rounded-xl mt-1"
                  value={details?.designer?.phoneNumber}
                  placeholder={'Номер телефона'}
                  placeholderTextColor="#7B7B8B"
                  onChangeText={(e) => setDetails(prevDetails => ({
                    ...prevDetails,
                    designer: { ...prevDetails.designer, phoneNumber: e }
                  }))}
                />
              </View>
              <TouchableOpacity
                onPress={() => { Linking.openURL(`tel:${details.designer?.phoneNumber || phoneNumber}`); }}
              >
                <Image
                  source={icons.phone}
                  className="w-8 h-8 ml-2"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row items-end mb-2">
              <Text className="font-pregular text-[20px] mr-2">Прораб</Text>

              <View className="flex-1">
                <View className="border-2 border-[#ccd6dd] rounded-2xl mb-2 h-8 flex-1">
                  <RNPickerSelect
                    onValueChange={(value) => {
                      console.log('Выбран Прораб:', value);
                      const selectedProrab = prorabs.find(m => m.$id === value);
                      console.log('Найденный Прораб:', selectedProrab);
                      if (selectedProrab) {
                        setDetails({
                          ...details,
                          prorab: {
                            name: selectedProrab.name,
                            prorabId: selectedProrab.$id,
                            phoneNumber: selectedProrab.phoneNumber
                          }
                        });
                      }
                    }}
                    value={details.prorab?.prorabId}
                    items={prorabs.map(m => ({
                      value: m.$id,
                      label: m.name,
                      key: m.$id
                    }))}
                    placeholder={{ label: 'Выберите прораба', value: null }}
                    style={{
                      inputIOS: { paddingVertical: 0, width: '100%' },
                      inputAndroid: { width: '100%' }
                    }}
                  />
                </View>

                <TextInput
                  className="flex-1 font-pregular text-base border-2 border-[#ccd6dd] py-0 px-4 rounded-xl mt-1"
                  value={details?.prorab?.phoneNumber}
                  placeholder={'Номер телефона'}
                  placeholderTextColor="#7B7B8B"
                  onChangeText={(e) => setDetails(prevDetails => ({
                    ...prevDetails,
                    prorab: { ...prevDetails.prorab, phoneNumber: e }
                  }))}
                />
              </View>
              <TouchableOpacity
                onPress={() => { Linking.openURL(`tel:${details.prorab?.phoneNumber || phoneNumber}`); }}
              >
                <Image
                  source={icons.phone}
                  className="w-8 h-8 ml-2"
                />
              </TouchableOpacity>
            </View>
          </View>

          <FormField
            multiline={true}
            numberOfStrokes={2}
            title='Адрес:'
            value={details.adress}
            onChangeText={(e) => { setDetails({ ...details, adress: e }) }}
          />

          <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

          {details.models.map((mod, index) =>
            <View className="my-2" key={index}>
              <View className="flex flex-row items-center">
                <TouchableOpacity
                  onPress={async () => {
                    // Создаем новый массив моделей без удаляемого элемента
                    const updatedModels = details.models.filter((_, i) => i !== index);

                    // Обновляем состояние
                    setDetails({
                      ...details,
                      models: updatedModels
                    });

                    try {
                      // Отправляем обновленные данные в базу
                      await updateOrder({
                        ...details,
                        models: updatedModels
                      });
                      console.log('Модель успешно удалена');
                    } catch (error) {
                      console.error('Ошибка при удалении модели:', error);
                    }
                  }}
                >
                  <Image
                    source={icons.delet}
                    className="w-6 h-6 mr-2"
                    tintColor={'#e15042'}
                  />
                </TouchableOpacity>
                <Text className="font-pbold text-[20px]">Заказ №{mod.number}</Text>
              </View>
              <View className="flex flex-row justify-between bg-white p-2 rounded-lg mt-1">
                <Text className="font-pregular text-[20px]">{mod.title}</Text>
                <Text className="font-pregular text-[20px]">{mod.price}₽</Text>
              </View>
            </View>
          )}

          <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

          <View className="flex flex-row justify-end">
            <TouchableOpacity>
              <Text className="font-pregular text-[20px] mr-4 text-[#777]">Итого</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="font-pregular text-[20px]">
                {details.models.reduce((total, mod) => total + mod.price, 0)}₽
              </Text>
            </TouchableOpacity>
          </View>


          {details.payments.map((pay, index) => {
            const day = pay.date.slice(8, 10);
            const month = pay.date.slice(5, 7);
            const year = `20${pay.date.slice(2, 4)}`; // Обратите внимание, что здесь предполагается, что год в формате 202x
            const monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

            return (
              <View className="flex flex-row justify-between my-4 items-center">
                <TouchableOpacity
                  className="mt-5"
                  onPress={() => {
                    setDetails({
                      ...details,
                      payments:
                        details.payments.filter((_, i) => i !== index)
                    });
                  }}
                >
                  <Image
                    source={icons.delet}
                    className="w-7 h-7"
                    tintColor={'#e15042'}
                  />
                </TouchableOpacity>
                <Text className="text-[20px] font-pregular">{day} {monthNames[parseInt(month) - 1]} {year}</Text>
                <Text className="text-[20px] font-pregular">{pay.amount}₽</Text>
              </View>
            );
          })}


          <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

          <View className="flex flex-row justify-end">
            <TouchableOpacity>
              <Text className="font-pregular text-[#777] text-[20px] mr-4">Остаток</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="font-pregular text-[20px]">
                {(details.models.reduce((total, mod) => total + mod.price, 0)) - (details.payments.reduce((totalPay, mod) => totalPay + mod.amount, 0))}₽
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-[340px] flex flex-row items-center mt-4">
            <FormField
              placeholder={'Новый платёж'}
              otherStyles={'flex-1'}
              onChangeText={text => setInputValue(text)} // Установим состояние для ввода
            />
            <TouchableOpacity
              onPress={() => {
                if (inputValue && inputValue.length > 0) {
                  setDetails({
                    ...details,
                    payments: [
                      ...details.payments,
                      {
                        amount: Number(inputValue),
                        date: new Date().toISOString(),
                      }
                    ]
                  });
                  setInputValue(''); // Очистим поле ввода после добавления платежа
                }
              }}
              className="bg-white border-2 w-[60px] h-[60px] flex justify-center items-center rounded-full ml-4">
              <Text className="text-[30px] font-pbold">₽</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View className="absolute bottom-[56px] flex flex-row justify-around rounded-2xl left-4 right-4 py-4 bg-white">
          <TouchableOpacity
            onPress={() => { setDetails({ visible: 0 }) }}
          >
            <Image
              className='w-10 h-10'
              source={icons.home}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setDetails({ visible: 0 }) }}
          >
            <Image
              className='w-10 h-10'
              source={icons.create}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              console.log('Данные перед сохранением:', {
                designer: details.designer,
                designerId: details.designerId,
                designerPhone: details.designerPhone,
                prorab: details.prorab,
                prorabId: details.prorabId,
                prorabPhone: details.prorabPhone
              });
              try {
                await updateOrder(details);
                console.log('Заказ успешно обновлен');
              } catch (error) {
                console.error('Ошибка при обновлении заказа:', error);
              }
            }}
          >
            <Image
              className='w-10 h-10'
              source={icons.tick}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  else if (details.visible === 2) {
    return (
      <ScrollView className="bg-white py-10 px-4">
        <View className="flex flex-row justify-between items-center">
          <TouchableOpacity>
            <Text className="text-[20px] font-pbold">PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: bgs[details.bg].bg }}
            className="px-2 py-1 rounded-lg border-2 border-[#d6e0f0] flex-1 mx-4">
            <Text className="font-pbold text-[18px] text-white">{details.title}</Text>
          </TouchableOpacity>
          <Text className="text-[22px] font-pbold">{details.order.title}</Text>
        </View>

        <View className="flex flex-row justify-between mt-4">
          {bgs.map((color, index) =>
            <TouchableOpacity
              onPress={() => {
                setDetails({
                  ...details,
                  bg: index
                })
              }}
              style={{ backgroundColor: color?.bg }}
              className="rounded-full border-2 border-[#d6e0f0] w-[16vw] h-[16vw] flex justify-center items-center">
              <Text className="font-pregular text-[16px] text-white text-center">{color.title}</Text>
            </TouchableOpacity>
          )}
        </View>

        <FormField
          title='Стоимость'
          value={String(details.price)}
          measure={'₽'}
          otherStyles={'mt-2'}
          onChangeText={(e) => { setDetails({ ...details, price: Number(e) }) }}
        />
        <FormField
          title='Расходы'
          value={String(
            (details.charges?.reduce((sum, charge) => sum + (Number(charge.cost) || 0), 0) || 0) +
            (details.masters?.reduce((sum, master) => sum + (Number(master.cost) || 0), 0) || 0)
          )}
          measure={'₽'}
          otherStyles={'mt-2'}
          editable={false}
        />

        <View className="w-full h-[2px] bg-light mt-4"></View>
        <Text className="text-[20px] font-pbold my-2">Расходы</Text>
        <View className="w-full h-[2px] bg-light"></View>

        {details.charges?.map((ch, index) =>
          <View className="felx flex-row justify-between my-2 items-center">
            <FormField
              title='Название'
              value={ch.title}
              otherStyles={'flex-1'}
              onChangeText={(e) => {
                const updatedCharges = [...details.charges];
                updatedCharges[index] = { ...updatedCharges[index], title: e };
                setDetails({ ...details, charges: updatedCharges });
              }}
            />
            <FormField
              title='Стоимость'
              value={String(ch.cost)}
              measure={'₽'}
              otherStyles={'flex-1 ml-4'}
              onChangeText={(e) => {
                const updatedCharges = [...details.charges];
                updatedCharges[index] = { ...updatedCharges[index], cost: Number(e) };
                setDetails({ ...details, charges: updatedCharges });
              }}
            />
            <TouchableOpacity
              onPress={() => {
                const updatedCharges = details.charges.filter((_, i) => i !== index);
                setDetails({ ...details, charges: updatedCharges });
              }}>
              <Image
                source={icons.delet}
                className="w-8 h-8 ml-2"
              />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity className="bg-light p-4 rounded-xl mt-2"
          onPress={() => {
            setDetails({
              ...details,
              charges: [...details.charges, { title: '', cost: 0 }]
            })
          }}
        >
          <Text className="font-pregular text-center text-[20px] text-[#777]">+ Добавить расход</Text>
        </TouchableOpacity>

        <View className="w-full h-[2px] bg-light mt-4"></View>
        <Text className="text-[20px] font-pbold my-2">Мастера</Text>
        <View className="w-full h-[2px] bg-light"></View>

        {details.masters?.map((master, masterIndex) => {
          return (
            <View key={masterIndex} className="mt-4">
              <View className="flex flex-row items-center">
                <View className="flex-1 border-2 border-[#ccd6dd] rounded-xl mt-8">
                  <RNPickerSelect
                    value={master.id}
                    onValueChange={(value) => {
                      const selectedMaster = masters.find(m => m.$id === value);
                      if (selectedMaster) {
                        const updatedMasters = [...details.masters];
                        updatedMasters[masterIndex] = {
                          ...updatedMasters[masterIndex],
                          name: selectedMaster.name,
                          id: selectedMaster.$id
                        };
                        setDetails({ ...details, masters: updatedMasters });
                      }
                    }}
                    items={masters.map(m => ({ value: m.$id, label: m.name }))}
                    style={{
                      inputIOS: { paddingVertical: 10, width: '100%' },
                      inputAndroid: { width: '100%' }
                    }}
                  />
                </View>

                <FormField
                  title='Сумма'
                  value={String(master.cost || '')}
                  measure={'₽'}
                  otherStyles={'flex-1 ml-4'}
                  onChangeText={(e) => {
                    const updatedMasters = [...details.masters];
                    updatedMasters[masterIndex] = {
                      ...updatedMasters[masterIndex],
                      cost: Number(e) || 0
                    };
                    setDetails({ ...details, masters: updatedMasters });
                  }}
                />

                <TouchableOpacity
                  onPress={() => {
                    const updatedMasters = [...details.masters];
                    updatedMasters[masterIndex] = {
                      ...updatedMasters[masterIndex],
                      showIcons: !updatedMasters[masterIndex].showIcons
                    };
                    setDetails({ ...details, masters: updatedMasters });
                  }}
                  className="flex flex-row items-center mt-2"
                >
                  {master.icon !== null ? (
                    <View className="bg-light rounded-lg p-2 ml-2 mt-5">
                      <Image
                        source={(() => {
                          switch (master.icon) {
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
                        })()}
                        className="w-[28px] h-[28px]"
                      />
                    </View>
                  ) : (
                    <View className="bg-light rounded-lg p-2 ml-2 mt-5">
                      <Text className="text-[22px]">+</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const updatedMasters = details.masters.filter((_, i) => i !== masterIndex);
                    setDetails({ ...details, masters: updatedMasters });
                  }}
                  className="mt-5 ml-2"
                >
                  <Image
                    source={icons.delet}
                    className="w-7 h-7"
                    tintColor={'#e15042'}
                  />
                </TouchableOpacity>

                {master.showIcons && (
                  <View className="flex flex-row flex-wrap w-[90px] absolute z-20 right-0 bg-[#e4e5e7] p-2 rounded-xl">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((iconIndex) => {
                      return (
                        <TouchableOpacity
                          key={iconIndex}
                          onPress={() => {
                            const updatedMasters = [...details.masters];
                            updatedMasters[masterIndex] = {
                              ...updatedMasters[masterIndex],
                              icon: iconIndex,
                              showIcons: false
                            };
                            setDetails({ ...details, masters: updatedMasters });
                          }}
                          className={`m-[2px] rounded-lg ${master.icon === iconIndex ? 'bg-green-400' : 'bg-light'}`}
                        >
                          <Image
                            source={(() => {
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
                            })()}
                            className="w-[25px] h-[25px] m-[3px]"
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          className="bg-light p-4 rounded-xl mt-2"
          onPress={() => {
            setDetails({
              ...details,
              masters: [...(details.masters || []), { name: '', cost: 0, icon: null, id: null }]
            });
          }}
        >
          <Text className="font-pregular text-center text-[20px] text-[#777]">+ Добавить мастера</Text>
        </TouchableOpacity>

        <View className="w-full h-[2px] bg-light mt-4"></View>
        <Text className="text-[20px] font-pbold my-2">Операции</Text>
        <View className="w-full h-[2px] bg-light"></View>

        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((iconIndex) => (
          <View key={iconIndex} className="flex flex-row items-center my-2">
            <TouchableOpacity
              className={`m-[2px] rounded-lg ${details.operations?.[iconIndex] === 0 ? 'bg-light' :
                details.operations?.[iconIndex] === 1 ? 'bg-green-300' :
                  details.operations?.[iconIndex] === 2 ? 'opacity-50' :
                    'bg-red-600'
                }`}
              onPress={() => {
                const currentStatus = details.operations?.[iconIndex] || 0;
                const newStatus = (currentStatus + 1) % 4;
                handleOperationUpdate(iconIndex, newStatus);
              }}
            >
              <Image
                source={(() => {
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
                })()}
                className="w-[25px] h-[25px] m-[3px]"
              />
            </TouchableOpacity>
            <FormField
              title='Комментарий'
              value={details.operationComments?.[iconIndex] || ''}
              otherStyles={'flex-1 ml-4'}
              onChangeText={(text) => {
                const updatedComments = { ...details.operationComments, [iconIndex]: text };
                setDetails({ ...details, operationComments: updatedComments });
              }}
            />
          </View>
        ))}

        <View className="w-full h-[2px] bg-light mt-4"></View>
        <TouchableOpacity
          className="bg-red-500 p-4 rounded-xl mt-4 mb-4"
          onPress={() => {
            archiveModel(details);
            setDetails({
              ...details,
              archived: true
            });
          }}
        >
          <Text className="font-pbold text-center text-[20px] text-white">Архивировать модель</Text>
        </TouchableOpacity>

        <View
          className="mt-9 mb-[80px] flex flex-row justify-between mx-auto bg-light rounded-xl p-4"
        >
          <TouchableOpacity
            onPress={() => { setDetails({ visible: 0 }) }}
          >
            <Image
              className='w-10 h-10 mx-2'
              source={icons.home}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              // Создаем полный массив из 13 элементов, заполняя недостающие нулями
              const fullOperations = Array(13).fill(0).map((_, index) =>
                details.operations?.[index] ?? 0
              );

              console.log('Отправляемые данные:', {
                ...details,
                charges: details.charges || [],
                icons: fullOperations // Используем полный массив
              });
              try {
                await updateModel({
                  ...details,
                  charges: details.charges || [],
                  icons: fullOperations // Используем полный массив
                });
                console.log('Данные успешно сохранены');
              } catch (error) {
                console.error('Ошибка при сохранении:', error);
              }
            }}
          >
            <Image
              className='w-10 h-10 mx-2'
              source={icons.tick}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  else if (details.visible === 3) {
    return (
      <ScrollView className="bg-light h-[100vh] p-4 pt-4">
        <TouchableOpacity onPress={() => setDetails({ visible: 0 })}
          className="absolute right-0"
        >
          <Image source={icons.close} className="w-10 h-10 mt-10" />
        </TouchableOpacity>
        <View className="bg-white rounded-xl p-4 mt-[120px] mb-4 mx-auto">
          <Image
            source={(() => {
              switch (details.iconIndex) {
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
            })()}
            className="w-[100px] h-[100px]"
          />
        </View>

        {details.models.map((module, index) => (
          <TouchableOpacity
            key={index}
            className="bg-white p-4 rounded-xl mb-4"
            onPress={() => {
              setDetails({
                visible: 2,
                ...module,
                order: { title: module.orderTitle }
              });
            }}
          >
            <Text className="font-pbold text-[18px] mb-2">{module.orderTitle}</Text>
            <Text className="font-pregular text-[16px]">{module.title}</Text>
          </TouchableOpacity>
        ))}

        <View className="h-[100px]" />
      </ScrollView>
    );
  }
  else {
    return (
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={horizontalScrollRef}
        className="bg-light h-full"
      >
        <View style={{ width: width }}>
          <ScrollView className="py-10 px-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setToRefresh(toRefresh + 1)
                }}
              />
            }
          >
            <View className="flex flex-row justify-between">
              <Text className="font-pbold text-[22px]">Баланс: 1,210,000₽</Text>

              <Image
                source={icons.settings}
                className="w-8 h-8"
              />
            </View>

            {console.log('Все заказы:', orders)}

            {orders.map((order, orderIndex) => {
              console.log('Обработка заказа:', orderIndex, order.title);
              console.log('Модели заказа:', JSON.stringify(order.models, null, 2));

              // Проверяем наличие моделей и фильтруем неархивированные
              const activeModels = (order.models || []).filter(module => {
                console.log('Проверка модели:', JSON.stringify(module, null, 2));

                // Всегда исключаем архивные
                if (module.archived) {
                  console.log('Модель архивирована:', module.title);
                  return false;
                }

                // Если глаз перечеркнут (visible === false), исключаем модели с bg === 1 или bg === 2
                if (!order.visible && (module?.bg === 1 || module?.bg === 2)) {
                  console.log('Модель скрыта из-за visible:', module.title);
                  return false;
                }

                console.log('Модель активна:', module.title);
                return true;
              });

              console.log('Заказ:', order.title, 'Активные модели:', JSON.stringify(activeModels, null, 2));

              return (
                <TouchableOpacity
                  onPress={() => {
                    console.log('Нажатие на заказ:', order.title);
                    setDetails({
                      visible: 1,
                      ...order
                    })
                  }}
                  className="p-4 bg-white mt-4 rounded-2xl" key={orderIndex}>
                  <View className="flex flex-row justify-between mb-2">
                    <Text className="font-pbold text-[22px]">{order.title}</Text>
                    <View className="flex flex-row items-center">
                      <TouchableOpacity onPress={() => { Linking.openURL(`https://wa.me/0${order.customer.phone}`) }}>
                        <Image
                          source={icons.whatsapp}
                          className="w-7 h-7 mx-2"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        const updatedOrders = [...orders];
                        updatedOrders[orderIndex].visible = !order.visible;
                        setOrders(updatedOrders);
                      }}>
                        <Image
                          source={order.visible ? icons.eye : icons.eyeHide}
                          className="w-8 h-8 mx-2"
                        />
                      </TouchableOpacity>
                      <Text className="font-pbold text-[22px] ml-2">{order.toEnd}</Text>
                    </View>
                  </View>

                  {activeModels.length > 0 ? (
                    activeModels.map((mod, modIndex) =>
                      <View className="mt-0" key={modIndex}>
                        <View className="w-full h-[2px] bg-light mb-4"></View>
                        <View className="flex flex-row items-center justify-between">
                          <TouchableOpacity
                            onPress={() => {
                              setDetails({
                                visible: 2,
                                order: order,
                                ...mod,
                                masters: mod.masters || [{ name: '', cost: 0 }],
                                operations: mod.icons ? [...mod.icons] : Array(13).fill(0),
                                operationComments: mod.comments ? [...mod.comments] : Array(13).fill('')
                              });
                            }}
                            style={{ backgroundColor: bgs[mod.bg].bg }}
                            className="px-2 py-1 rounded-lg border-2 border-[#d6e0f0] flex-1 mr-2">
                            <Text className="font-pbold text-[18px] text-white">{mod.title}</Text>
                          </TouchableOpacity>

                          <View className="flex flex-row">
                            {mod?.icons?.slice(0, 4).map((iconStatus, iconIndex) => {
                              const iconStyles = `
                                ${iconStatus === 0 ? 'bg-light' :
                                  iconStatus === 1 ? 'bg-green-300' :
                                    iconStatus === 2 ? 'opacity-50' :
                                      'bg-red-600'} 
                              `;
                              const IconComponent = () => {
                                switch (iconIndex) {
                                  case 0: return icons.alert;
                                  case 1: return icons.measure;
                                  case 2: return icons.triangular;
                                  case 3: return icons.warranty;
                                  default: return null;
                                }
                              };

                              return (
                                <TouchableOpacity
                                  key={iconIndex}
                                  className={`${iconStyles} m-[2px] rounded-lg`}
                                  onPress={() => {
                                    if (iconStatus !== 3) {
                                      handleIconUpdate(orderIndex, modIndex, iconIndex, (iconStatus + 1) % 3, order);
                                    }
                                  }}
                                >
                                  <Image
                                    source={IconComponent()}
                                    className="w-[25px] h-[25px] m-[3px]"
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        <View className="flex flex-row justify-between mt-[2px]">
                          {mod?.icons?.slice(4).map((iconStatus, iconIndex) => {
                            const iconStyles = `
                              ${iconStatus === 0 ? 'bg-light' :
                                iconStatus === 1 ? 'bg-green-300' :
                                  iconStatus === 2 ? 'opacity-50' :
                                    'bg-red-600'} 
                            `;
                            const IconComponent = () => {
                              switch (iconIndex + 4) {
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

                            return (
                              <TouchableOpacity
                                key={iconIndex + 4}
                                className={`${iconStyles} m-[2px] rounded-lg`}
                                onPress={() => {
                                  if (iconStatus !== 3) {
                                    handleIconUpdate(orderIndex, modIndex, iconIndex + 4, (iconStatus + 1) % 3, order);
                                  }
                                }}
                              >
                                <Image
                                  source={IconComponent()}
                                  className="w-[25px] h-[25px] m-[3px]"
                                />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )
                  ) : (
                    <View className="mt-4">
                      <Text className="font-pregular text-[18px] text-gray-500 text-center">Подходящих позиций мебели нет</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <View className="mt-[10vh]"></View>
          </ScrollView>
        </View>

        <View style={{ width: width }} className="bg-light p-4 pt-10">
          <Text className="text-[20px] font-pbold mb-4">Иконки</Text>
          <View className="flex flex-row flex-wrap justify-between">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((iconIndex) => {
              const count = iconIndex < 13 ? (orders || []).reduce((total, order) => {
                return total + (order.models || []).reduce((moduleTotal, module) => {
                  return moduleTotal + (module.icons?.[iconIndex] === 0 ? 1 : 0);
                }, 0);
              }, 0) : null;

              return (
                <TouchableOpacity
                  key={iconIndex}
                  className="w-[22%] items-center mb-4 bg-white rounded-2xl py-4 justify-center"
                  onPress={() => {
                    if (iconIndex < 13) {
                      setDetails({
                        visible: 3,
                        iconIndex: iconIndex,
                        title: 'Иконка',
                        models: (orders || []).reduce((acc, order) => {
                          const matchingModules = (order.models || []).filter(module =>
                            module.icons?.[iconIndex] === 0
                          );
                          return [...acc, ...matchingModules.map(module => ({
                            ...module,
                            orderTitle: order.title
                          }))];
                        }, []),
                        operations: Array(13).fill(0).map((_, index) =>
                          index === iconIndex ? 0 : 2
                        )
                      });
                    }
                  }}
                >
                  {count !== null && <Text className="text-[16px] font-pregular mb-2">{count}</Text>}
                  <Image
                    source={(() => {
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
                        case 13: return icons.delivery;
                        case 14: return icons.queue;
                        case 15: return icons.hangar;
                        default: return null;
                      }
                    })()}
                    className="w-[10vw] h-[10vw]"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  }
}

export default Home;