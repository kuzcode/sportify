import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "athlete.com",
  projectId: "6643606a0030b84ad348",
  storageId: "664360cb00074ddf21ba",
  databaseId: "66436112002197655892",
  userCollectionId: "6643612b002156c73ac7",
  videoCollectionId: "664361be001d94a207b5",
  commsCollectionId: "664361be001d94a207b5",
  mapCollectionId: "66ce01d2001ca5a26ab5",
  markerCollectionId: "66cdfd33003c3196a832",
  trainingsCollectionId: "66c24424003ac2b404f4",
  trackersCollectionId: "66dbf058001a7fad3d97",
  routesCollectionId: "670192ce002213fc53b2",
  completedCollectionId: "670b6de50001fdbb67ad",
  mealCollectionId: "6740dd300031622f584f",
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Register user
export async function createUser(email, password, username, name, sports) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(name);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        imageUrl: avatarUrl,
        name: name,
        sports: sports
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique()
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

export async function startMeal(form) {
  try {
    const mealData = {
      userId: form.userId,
      goal: form.goal,
      eaten: [],
      type: form.type,
      height: parseInt(form.height),
      weight: parseInt(form.weight),
    };

    // Сохраняем данные в AsyncStorage
    await AsyncStorage.setItem('mealData', JSON.stringify(mealData));

    return mealData; // Возвращаем сохраненные данные
  } catch (error) {
    throw new Error(error);
  }
}


export async function createRoute(userId, coords, descr) {
  try {
    const newRoute = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.routesCollectionId,
      ID.unique(),
      {
        userId: userId,
        coord: coords,
        description: descr
      }
    );

    return newRoute;
  } catch (error) {
    throw new Error(error);
  }
}

export async function saveCompleted(userId, type, time, distance) {
  const dataToSave = {
    userId: userId,
    typ: type,
  };

  if (time && time !== 0) {
    dataToSave.time = time;
  }
  if (distance && distance !== 0) {
    dataToSave.distance = parseFloat(distance);
  }

  console.log(typeof dataToSave.distance)

  try {
    const completed = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.completedCollectionId,
      ID.unique(),
      dataToSave
    );

    return completed;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createTracker(form) {
  try {
    const newTracker = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.trackersCollectionId,
      ID.unique(),
      {
        name: form.name,
        goal: form.goal,
        done: 0,
        color: form.color,
        type: form.type,
        userId: form.userId
      }
    );

    return newTracker;
  } catch (error) {
    throw new Error(error);
  }
}

export async function createMap(userId, marker) {
  try {
      const map = await databases.listDocuments(
        appwriteConfig.databaseId, // databaseId
        appwriteConfig.mapCollectionId,
        [Query.equal("userId", userId)]
);

const newMarker = await databases.createDocument(
  appwriteConfig.databaseId,
  appwriteConfig.markerCollectionId,
  ID.unique(),
  {
    latitude: marker.coordinate.latitude, 
    longitude: marker.coordinate.longitude,
    time: 0
  }
);

const existingMarkers = map.documents[0].markers || [];

      // Add the new marker to the markers array
      const updatedMarkers = [...existingMarkers, newMarker.$id];



if(map.length !== 0) {
  const result = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.mapCollectionId,
    map.documents[0].$id, // documentId
    {
      markers: updatedMarkers,
    }
);

return result;
}
  else {
      const newMap = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.mapCollectionId,
        ID.unique(),
        {
          userId: userId,
          markers: [newMarker.$id],
        }
      );
      return newMap;
    }
  } catch (error) {
    throw new Error(error);
  }
}


// Get all video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateTracker(tracker) {
  try {
    const result = await databases.updateDocument(
      appwriteConfig.databaseId, // databaseId
      appwriteConfig.trackersCollectionId, // collectionId
      tracker.id, // documentId
      {
        name: tracker.name,
        goal: tracker.goal,
      }, // data (optional)
  );
  
  return result;
  } catch (error) {
    throw new Error(error);
  }
}


export async function updateUser(form) {
  try {
    const result = await databases.updateDocument(
      appwriteConfig.databaseId, // databaseId
      appwriteConfig.userCollectionId, // collectionId
      form.id, // documentId
      {
        name: form.name,
        bio: form.bio,
        username: form.username,
        sports: form.sports,
      }, 
  );
  
  return result;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAllUsers() {
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId
    );

    return users.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteRoute(routeId) {
  try {
    const result = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.routesCollectionId,
      routeId
  );

    return result;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserMeal() {
  try {
    const mealDataString = await AsyncStorage.getItem('mealData');
    console.log(mealDataString)

    if (mealDataString !== null) {
      const mealData = JSON.parse(mealDataString); // Преобразуем строку обратно в объект
      return mealData; // Возвращаем данные
    } else {
      return null; // Если данных нет, возвращаем null
    }
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserCommunities(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}


export async function getUserCompleted(userId) {
  try {
    const completed = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.completedCollectionId,
      [Query.equal("userId", userId)]
    );

    return completed.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserMap(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.mapCollectionId,
      [Query.equal("userId", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAllRoutes() {
  try {
    const routes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.routesCollectionId,
    );

    return routes.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserTrackers(userId) {
  try {
    const trackers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.trackersCollectionId,
      [Query.equal("userId", userId)]
    );

    return trackers.documents;
  } catch (error) {
    throw new Error(error);
  }
}


export async function getUserTrainings(userId) {
  try {
    const trainings = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.trainingsCollectionId,
      [Query.equal("creator", userId)]
    );

    return trainings.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserById(userId) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('$id', userId)]
  );

    return result;
  } catch (error) {
    throw new Error(error);
  }
}


export async function getTrainingsForYou(sports) {
  try {
    const trainings = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.trainingsCollectionId
    );

    // Фильтруем тренировки по виду спорта
    const filteredTrainings = trainings.documents.filter(training =>
      sports.includes(training.kind)
    );

    return filteredTrainings;
  } catch (error) {
    throw new Error(error);
  }
}



// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}
