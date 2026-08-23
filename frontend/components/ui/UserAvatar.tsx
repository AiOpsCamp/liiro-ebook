import React from "react";
import { View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { User } from "lucide-react-native";

interface UserAvatarProps {
  userData: any;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userData }) => {
  const hasProfilePic = userData?.profilePicture;

  return (
    <View className="h-12 w-12 rounded-full overflow-hidden border-2 border-sunbeam">
      {hasProfilePic ? (
        <ExpoImage
          source={{ uri: userData.profilePicture }}
          className="h-full w-full"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View className="h-full w-full bg-A2CA71 items-center justify-center">
          <User size={24} color="white" />
        </View>
      )}
    </View>
  );
};

export default UserAvatar;
