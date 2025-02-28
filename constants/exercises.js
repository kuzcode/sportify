export const exercises = [
    {
        title: 'гантель на бицепс', //0
        img: 'https://static13.tgcnt.ru/posts/_0/2c/2c13c668bb8d50c4bff23f195a90e7b1.jpg',
        description: 'на выдохе подъём гантели',
        tab: 2
    },
    {
        title: 'штанга на бицепс', //1
        img: 'https://thumbsnap.com/i/8ghc39PR.jpg',
        description: 'подъём на выдохе, часть руки от локтя до плеча не двигай',
        tab: 2
    },
    {
        title: 'тяга блока на бицепс', //2
        img: 'https://sportishka.com/uploads/posts/2023-06/1687214515_sportishka-com-p-bitseps-v-blochnom-trenazhere-instagram-36.png',
        description: 'часть руки от плеча до локтя остается неподвижной',
        tab: 2
    },
    {
        title: 'верхний блок на трицепс', //3
        img: 'https://i.pinimg.com/736x/8d/b6/02/8db6023c4d7e99ee65d6a1e74a323b10.jpg',
        description: 'на выдохе, напрягая трицепсы, опусти рукоять вниз',
        tab: 2
    },
    {
        title: 'разгибание рук с гантелью над головой', //4
        img: 'https://avatars.dzeninfra.ru/get-zen_doc/4457333/pub_621fa6cb0728400008572843_621fa8245529cb2055a456fe/scale_1200',
        description: 'на трицепс, разгибай руки на выдохе',
        tab: 2
    },
    {
        title: 'французский жим', //5
        img: 'https://static.potreningu.pl/exercises/2022/0907/167_4a7f690fbc73a3dd10850101b8636069.png',
        description: 'на трицепс, разгибай руки на выдохе',
        tab: 2
    },
    {
        title: 'отжимания от скамьи на трицепс', //6
        img: "https://i.pinimg.com/736x/a2/c6/00/a2c600c2f600a6cbd350046b51449773.jpg",
        tab: 2,
        description: 'при опускании тела к полу вдох',
        weightNeed: false
    },
    {
        title: 'алмазные отжимания', //7
        tab: 2,
        img: 'https://i.pinimg.com/736x/a2/c6/00/a2c600c2f600a6cbd350046b51449773.jpg',
        description: 'кисти рук максимально близко друг к другу',
        weightNeed: false
    },
    {
        title: 'отжимания на брусьях', //8
        img: 'https://avatars.mds.yandex.net/i?id=629d14ae1d1b726868bf212cd9879f77_l-10339933-images-thumbs&n=13',
        description: 'слишком сильно не опускайся, до 90° в локтях',
        tab: 3,
        weightNeed: false
    },
    {
        title: 'жим штанги лёжа', //9
        description: 'мировой рекорд — 355кг',
        img: 'https://avatars.mds.yandex.net/i?id=ba3a87195192d2333774a08a75a03c1c087c18b0-4008581-images-thumbs&n=13',
        tab: 3,
    },
    {
        title: 'сведение гантелей лёжа', //10
        tab: 3,
        img: "https://i.pinimg.com/originals/0c/18/3b/0c183bfa4885ab92658c812e2a93e690.png",
        description: ""
    },
    {
        title: 'жим штанги лёжа с наклоном', //11
        tab: 3,
        img: "",
        description: ""
    },
    {
        title: 'сведение рук в кроссовере', //12
        tab: 3,
        img: "",
        description: ""
    },
    {
        title: 'тяга т-штанги обеими руками в наклоне', //13
        tab: 3,
        img: "",
        description: ""
    },
    {
        title: 'отжимания от пола', //14
        tab: 3,
        weightNeed: false,
        img: "",
        description: ""
    },
    {
        title: 'подтягивания', //15
        tab: 4,
        weightNeed: false,
        img: "",
        description: ""
    },
    {
        title: 'тяга на нижнем блоке', //16
        tab: 4,
        img: "",
        description: ""
    },
    {
        title: 'тяга гантели в наклоне', //16
        tab: 4,
        img: "",
        description: ""
    },
    {
        title: 'становая тяга', //16
        tab: 4,
        img: "",
        description: ""
    },
    {
        title: 'приседания со штангой', //16
        tab: 5,
        img: "",
        description: ""
    },
    {
        title: 'жим ногами', //16
        tab: 5,
        img: "",
        description: ""
    },
    {
        title: 'выпрямление ног на квадрицепс', //16
        tab: 5,
        img: "",
        description: ""
    },
    {
        title: 'сгибание ног на бицепс', //16
        tab: 5,
        img: "",
        description: ""
    },
    {
        title: 'выпады со штангой', //16
        tab: 5,
        img: "",
        description: ""
    },
]
export const datas = [
    {
        name: 'программа арнольда шварцнеггера',
        desc: '6 дня в неделю, в спортзале',
        description: 'по этой программе тренировался арнольд шварцнеггер',
        type: 'сплит',
        img: 'https://news.store.rambler.ru/img/c27c53f91466827916308f1767351c8b?img-format=auto&img-1-resize=height:565,fit:max&img-2-filter=sharpen',
        exType: 0, //weekly
        days: [{
            day: 1, //monday
            icon: 'muscles',
            title: 'день груди, спины и ног',
            ex: [{
                ind: 9,
                aReps: 5,
                bReps: 8,
            },
            {
                ind: 10,
                aReps: 5,
                bReps: 8,
            },
            {
                ind: 11,
                aReps: 6,
                bReps: 8,
            },
            {
                ind: 12,
                aReps: 5,
                bReps: 10,
            },
            {
                ind: 8,
                aReps: 5,
                bReps: 'максимум',
            },
            {
                ind: 15,
                aReps: 5,
                bReps: 'максимум',
            },
            {
                ind: 13,
                aReps: 5,
                bReps: 8,
            },
            {
                ind: 12,
                aReps: 5,
                bReps: 10,
            },
            {
                ind: 12,
                aReps: 5,
                bReps: 10,
            },
            {
                ind: 12,
                aReps: 5,
                bReps: 10,
            },
            ]
        },
        {
            day: 3, //wednsday
            icon: 'muscles',
            title: 'день рук, среда',
            ex: [{
                ind: 0,
                aReps: 3,
                bReps: 8,
            }]
        }
        ]
    }
]

export const oneProgram = [
    {
        name: 'бицепсы с атлетом',
        desc: 'на руки, 1 час',
        exercises: [
            {
                title: 'гантель на бицепс',
                tab: 2,
                reps: [
                    {
                        reps: 10,
                        weight: 20,
                    }
                ]
            },
            {
                title: 'штанга на бицепс',
                tab: 2,
                reps: [
                    {
                        reps: 10,
                        weight: 20,
                    }
                ]
            },
        ]
    }
]