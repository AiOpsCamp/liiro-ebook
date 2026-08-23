import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}

async function registerForPushNotificationsAsync() {
  // Skip on web platform - push notifications work differently and don't require this permission
  if (Platform.OS === "web") {
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Permission not granted!");
    return;
  }
}

export default registerForPushNotificationsAsync;
