import { ScrollView, Text, TouchableOpacity, View, Image, RefreshControl, Alert, Dimensions } from "react-native";
import { icons } from "../../constants";
import { getOrders, updateOrder, updateModel } from "../../lib/appwrite";
import { useEffect, useState } from "react";
import { FormField } from "../../components";
import RNPickerSelect from "react-native-picker-select";

const Hammer = () => {
    const [orders, setOrders] = useState([]);
    const [toRefresh, setToRefresh] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'hangar', 'delivery'
    const [details, setDetails] = useState({
        visible: 0
    });
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
                });
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

    const handleIconUpdate = (orderIndex, modIndex, iconIndex, newStatus, order) => {
        const newIcons = [...orders[orderIndex].modules[modIndex].icons];
        newIcons[iconIndex] = newStatus;
        const updatedModule = { ...orders[orderIndex].modules[modIndex], icons: newIcons };
        const updatedModules = [...orders[orderIndex].modules];
        updatedModules[modIndex] = updatedModule;
        const updatedOrders = [...orders];
        updatedOrders[orderIndex].modules = updatedModules;
        setOrders(updatedOrders);

        updateOrder(order);
    };

    const handleOperationUpdate = (iconIndex, newStatus) => {
        const updatedOperations = [...(details.operations || Array(13).fill(0))];
        updatedOperations[iconIndex] = newStatus;
        setDetails({ ...details, operations: updatedOperations });

        const orderIndex = orders.findIndex(order => order.$id === details.order.$id);
        if (orderIndex !== -1) {
            const modIndex = orders[orderIndex].modules.findIndex(mod => mod.id === details.id);
            if (modIndex !== -1) {
                const newIcons = [...orders[orderIndex].modules[modIndex].icons];
                newIcons[iconIndex] = newStatus;
                const updatedModule = { ...orders[orderIndex].modules[modIndex], icons: newIcons };
                const updatedModules = [...orders[orderIndex].modules];
                updatedModules[modIndex] = updatedModule;
                const updatedOrders = [...orders];
                updatedOrders[orderIndex].modules = updatedModules;
                setOrders(updatedOrders);
            }
        }
    };

    const filterModels = (order) => {
        if (!order.modules) return [];

        return order.modules.filter(module => {
            if (module.archived) return false;

            switch (activeTab) {
                case 'queue':
                    return module.bg === 4 && module.icons?.every(icon => icon === 0);
                case 'hangar':
                    return module.bg === 2;
                case 'delivery':
                    return module.bg === 0;
                default:
                    return false;
            }
        });
    };

    if (details.visible === 1) {
        return (
            <ScrollView className="bg-white py-10 px-4">
                <View className="flex flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={() => { setDetails({ visible: 0 }) }}
                    >
                        <Image
                            className='w-10 h-10'
                            source={icons.home}
                        />
                    </TouchableOpacity>
                    <Text className="font-pbold text-[22px]">{details.title}</Text>
                    <Text className="font-pbold text-[22px]">{details.toEnd}</Text>
                </View>

                <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

                <FormField
                    title='Клиент:'
                    value={details.customer?.name}
                    onChangeText={(e) => { setDetails({ ...details, customer: { ...details.customer, name: e } }) }}
                />

                <FormField
                    title='Телефон:'
                    value={details.customer?.phone}
                    onChangeText={(e) => { setDetails({ ...details, customer: { ...details.customer, phone: e } }) }}
                />

                <FormField
                    title='Адрес:'
                    value={details.adress}
                    onChangeText={(e) => { setDetails({ ...details, adress: e }) }}
                />

                <View className="h-[2px] w-full bg-slate-300 my-4 rounded-xl"></View>

                {details.modules.map((mod, index) =>
                    <View className="my-2" key={index}>
                        <View className="flex flex-row items-center">
                            <TouchableOpacity
                                onPress={async () => {
                                    const updatedModules = details.modules.filter((_, i) => i !== index);
                                    setDetails({
                                        ...details,
                                        modules: updatedModules
                                    });

                                    try {
                                        await updateOrder({
                                            ...details,
                                            modules: updatedModules
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
                            {details.modules.reduce((total, mod) => total + mod.price, 0)}₽
                        </Text>
                    </TouchableOpacity>
                </View>

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
            </ScrollView>
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
                            style={{ backgroundColor: color.bg }}
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

                <Text className="font-pbold text-[20px] mt-4">Операции</Text>

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
                    </View>
                ))}

                <View className="absolute bottom-[56px] flex flex-row justify-around rounded-2xl left-4 right-4 py-4 bg-white">
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
                            const fullOperations = Array(13).fill(0).map((_, index) =>
                                details.operations?.[index] ?? 0
                            );

                            try {
                                await updateModel({
                                    ...details,
                                    charges: details.charges || [],
                                    icons: fullOperations
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
    else {
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
                    <View className="flex flex-row justify-between mb-4">
                        <TouchableOpacity
                            onPress={() => setActiveTab('queue')}
                            className={`flex-1 p-4 rounded-xl mr-2 ${activeTab === 'queue' ? 'bg-[#3c87ff]' : 'bg-white'}`}
                        >
                            <Image
                                source={icons.queue}
                                className="w-8 h-8 mx-auto"
                                tintColor={activeTab === 'queue' ? 'white' : '#666'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('hangar')}
                            className={`flex-1 p-4 rounded-xl mx-2 ${activeTab === 'hangar' ? 'bg-[#3c87ff]' : 'bg-white'}`}
                        >
                            <Image
                                source={icons.hangar}
                                className="w-8 h-8 mx-auto"
                                tintColor={activeTab === 'hangar' ? 'white' : '#666'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('delivery')}
                            className={`flex-1 p-4 rounded-xl ml-2 ${activeTab === 'delivery' ? 'bg-[#3c87ff]' : 'bg-white'}`}
                        >
                            <Image
                                source={icons.delivery}
                                className="w-8 h-8 mx-auto"
                                tintColor={activeTab === 'delivery' ? 'white' : '#666'}
                            />
                        </TouchableOpacity>
                    </View>

                    {orders.map((order, orderIndex) => {
                        const filteredModels = filterModels(order);

                        if (filteredModels.length === 0) return null;

                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    setDetails({
                                        visible: 1,
                                        ...order
                                    })
                                }}
                                className="p-4 bg-white my-4 rounded-2xl" key={orderIndex}>
                                <View className="flex flex-row justify-between mb-2">
                                    <Text className="font-pbold text-[22px]">{order.title}</Text>
                                    <View className="flex flex-row items-center">
                                        <Text className="font-pbold text-[22px] ml-2">{order.toEnd}</Text>
                                    </View>
                                </View>

                                {filteredModels.map((mod, modIndex) =>
                                    <View className="mt-0 flex flex-row items-center flex-wrap" key={modIndex}>
                                        <View className="w-full h-[2px] bg-light mb-4"></View>
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
                                            className="px-2 py-1 rounded-lg border-2 border-[#d6e0f0] w-[52%]">
                                            <Text className="font-pbold text-[18px] text-white">{mod.title}</Text>
                                        </TouchableOpacity>

                                        {mod?.icons?.map((iconStatus, iconIndex) => {
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
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    <View className="mt-[10vh]"></View>
                </View>
            </ScrollView>
        );
    }
}

export default Hammer;
