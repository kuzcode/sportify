import { ScrollView, Text, TouchableOpacity, View, Linking, Image, Dimensions, TextInput, RefreshControl } from "react-native";
import { icons } from "../../constants";
import { getOrders, updateOrder, updateTracker } from "../../lib/appwrite";
import { useEffect, useState } from "react";
import RNPickerSelect from "react-native-picker-select";
import { FormField } from "../../components";

const Home = () => {
  const [orders, setOrders] = useState([]);
  const [toRefresh, setToRefresh] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+7977');
  const [inputValue, setInputValue] = useState('');
  const [details, setDetails] = useState({
    visible: false
  });

  const { width } = Dimensions.get("window");

  const iconsList = [
    { src: 'blade' },
    { src: 'edge' },
    { src: 'drill' },
    { src: 'tool' },
    { src: 'spray' },
    { src: 'screwdriver' },
    { src: 'screwdriver' },
    { src: 'container' },
    { src: 'triangular' },
    { src: 'measure' },
    { src: 'alert' },
    { src: 'warranty' },
    { src: 'queue' },
    { src: 'delivery' },
    { src: 'shuffle' },
    { src: 'hangar' },
  ]

  useEffect(() => {
    async function getOrdersFunc() {
      try {
        const data = await getOrders();
        const updatedOrders = data.map(order => {
          const endDate = new Date(order.endDate);
          const today = new Date();
          const timeDiff = endDate - today; // Разница во времени в миллисекундах
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Перевод в дни

          return {
            ...order,
            visible: true,
            toEnd: daysDiff >= 0 ? daysDiff : 0, // Устанавливаем 0, если разница отрицательная
            modules: order.modules.map(module => ({
              ...module,
              icons: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Инициализация icons в каждом модуле
            }))
          };
        });
        setOrders(updatedOrders);
      }
      catch (e) {
        console.log(e);
      }
    }

    getOrdersFunc();
  }, [toRefresh]);


  if (details.visible === true) {
    return (
      <View>
        <ScrollView className="bg-light h-[90vh] p-4 pt-10">
          <View className="flex flex-row justify-between mb-4">
            <TextInput
              className="bg-white border-2 border-[#ccd6dd] py-1 flex-1 mr-4 rounded-xl text-center font-pbold text-[20px]"
              value={details.title}
              onChangeText={(e) => { setDetails({ ...details, title: e }) }}
            />

            <TextInput
              className="bg-white border-2 border-[#ccd6dd] py-1 px-2 rounded-xl text-center"
              value={String(details.toEnd)}
              onChangeText={(e) => { setDetails({ ...details, toEnd: Number(e) }) }}
            />

            <TouchableOpacity>
              <Image
                source={icons.whatsapp}
                className="w-8 h-8 ml-4"
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mb-4">
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

          <View className="flex-row items-center" style={{ height: 60 }}>
            <Text className="font-pregular text-[20px] mr-2">Дизайнер</Text>

            <View className="flex-1 border-2 border-[#ccd6dd] rounded-xl">
              <RNPickerSelect
                onValueChange={(value) => setDetails({ ...details, designer: value })}
                items={[
                  { label: "Вася", value: "Вася" },
                  { label: "Никита", value: "Никита" },
                ]}
                style={{
                  inputIOS: { paddingVertical: 10, width: '100%' },
                  inputAndroid: { width: '100%' }
                }}
              />
            </View>

            <TouchableOpacity
              onPress={() => { Linking.openURL(`tel:${phoneNumber}`); }}
            >
              <Image
                source={icons.phone}
                className="w-8 h-8 ml-2"
              />
            </TouchableOpacity>
          </View>



          <View className="flex-row items-center" style={{ height: 60 }}>
            <Text className="font-pregular text-[20px] mr-2">Прораб</Text>

            <View className="flex-1 border-2 border-[#ccd6dd] rounded-xl">
              <RNPickerSelect
                onValueChange={(value) => setDetails({ ...details, prorab: value })}
                items={[
                  { label: "Вася", value: "Вася" },
                  { label: "Никита", value: "Никита" },
                ]}
                style={{
                  inputIOS: { paddingVertical: 10, width: '100%' },
                  inputAndroid: { width: '100%' }
                }}
              />
            </View>

            <TouchableOpacity
              onPress={() => { Linking.openURL(`tel:${phoneNumber}`); }}
            >
              <Image
                source={icons.phone}
                className="w-8 h-8 ml-2"
              />
            </TouchableOpacity>
          </View>


          <FormField
            multiline={true}
            numberOfStrokes={2}
            title='Адрес'
            value={details.adress}
            onChangeText={(e) => { setDetails({ ...details, adress: e }) }}
          />

          <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

          {details.modules.map(mod =>
            <View className="flex flex-row justify-between" key={mod.id}>
              <TouchableOpacity>
                <Text className="font-pregular text-[20px]">{mod.title}</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="font-pregular text-[20px]">{mod.price}₽</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

          <View className="flex flex-row justify-between">
            <TouchableOpacity>
              <Text className="font-pregular text-[20px]">Итого</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="font-pregular text-[20px]">
                {details.modules.reduce((total, mod) => total + mod.price, 0)}₽
              </Text>
            </TouchableOpacity>
          </View>


          {details.payments.map((pay, index) => {
            const day = pay.date.slice(8, 10);
            const month = pay.date.slice(5, 7);
            const year = `20${pay.date.slice(2, 4)}`; // Обратите внимание, что здесь предполагается, что год в формате 202x
            const monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

            return (
              <View className="flex flex-row justify-between my-4">
                <TouchableOpacity
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

          <View className="flex flex-row justify-between">
            <TouchableOpacity>
              <Text className="font-pregular text-[20px]">Остаток</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="font-pregular text-[20px]">
                {(details.modules.reduce((total, mod) => total + mod.price, 0)) - (details.payments.reduce((totalPay, mod) => totalPay + mod.amount, 0))}₽
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-[340px] flex flex-row items-center">
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
              className="bg-white border-2 w-[60px] h-[60px] flex justify-center items-center rounded-full mt-8 ml-4">
              <Text className="text-[30px] font-pbold">₽</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View className="absolute bottom-[-30px] flex flex-row justify-around left-0 right-0 py-4 bg-white">
          <TouchableOpacity
            onPress={() => { setDetails({ visible: false }) }}
          >
            <Image
              className='w-10 h-10'
              source={icons.home}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setDetails({ visible: false }) }}
          >
            <Image
              className='w-10 h-10'
              source={icons.create}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              updateOrder(details)
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
  else {
    return (
      <ScrollView
        horizontal={true}
        className="width-[200vw]"
        decelerationRate="fast"
        snapToInterval={width}
      >
        <ScrollView className="bg-light h-full w-[100vw] py-10 px-4"
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

          {orders.map((order, orderIndex) =>
            <TouchableOpacity
              onPress={() => {
                setDetails({
                  visible: true,
                  ...order
                })
              }}
              className="p-4 bg-white my-4 rounded-2xl" key={orderIndex}>
              <View className="flex flex-row justify-between mb-2">
                <Text className="font-pbold text-[22px]">{order.title}</Text>
                <View className="flex flex-row items-center">
                  <TouchableOpacity onPress={() => { Linking.openURL(`https://wa.me/${order.customer.phone}`) }}>
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

              {order.modules?.map((mod, modIndex) =>
                <View className="mt-0 flex flex-row items-center flex-wrap" key={modIndex}>
                  <View className="w-full h-[2px] bg-light mb-4"></View>
                  <View className="bg-light px-2 py-1 rounded-lg border-2 border-[#d6e0f0] w-[52%]">
                    <Text className="font-pbold text-[18px]">{mod.title}</Text>
                  </View>

                  {mod?.icons?.map((iconStatus, iconIndex) => {
                    const iconStyles = `
                    opacity-${iconStatus === 0 ? '100' : iconStatus === 1 ? '100' : '50'} 
                    ${iconStatus === 0 ? 'bg-light' : iconStatus === 1 ? 'bg-green-300' : 'bg-white'}
                `;
                    const IconComponent = () => {
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

                    return (
                      <TouchableOpacity
                        key={iconIndex}
                        className={`${iconStyles} m-[2px] rounded-lg`}
                        onPress={() => {
                          const newIcons = [...mod.icons];
                          newIcons[iconIndex] = (iconStatus + 1) % 3; // меняем статус от 0 до 2
                          const updatedModule = { ...mod, icons: newIcons };
                          const updatedModules = [...order.modules];
                          updatedModules[modIndex] = updatedModule;
                          const updatedOrders = [...orders];
                          updatedOrders[orderIndex].modules = updatedModules; // обновляем модули в заказе
                          setOrders(updatedOrders); // обновляем весь массив orders

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
              )}

            </TouchableOpacity>
          )}
        </ScrollView>

        <View className="w-[100vw] h-[100vh]">
          <View className="flex flex-row flex-wrap justify-around py-10 px-4">
            {iconsList.map(ico =>
              <Image
                source={icons[ico.src]}
                className="w-[17vw] h-[17vw] m-[2w]"
              />
            )}
          </View>
        </View>
      </ScrollView>
    );
  }
}

export default Home;