import { View, ActivityIndicator, Dimensions, Platform } from "react-native";
import { ResizeMode, Video } from "expo-av";
import video from "../loader.mp4"

const Loader = ({ isLoading }) => {
  const osName = Platform.OS;
  const screenHeight = Dimensions.get("screen").height;

  if (!isLoading) return null;

  return (
    <View
      className="absolute flex justify-center items-center w-full h-full bg-primary z-10"
      style={{
        height: screenHeight,
      }}
    >
      <Video
        source={video}
        className="w-full h-full mt-3 absolute top-0 m-0"
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted={true}
      />

    </View>
  );
};

export default Loader;
