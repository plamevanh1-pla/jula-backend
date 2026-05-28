  import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

// =====================================
// 🔔 GLOBAL CONFIG
// =====================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// =====================================
// 📲 REGISTER PUSH TOKEN (PRO)
// =====================================
export async function registerForPushNotifications(userId) {
  try {
    if (!Device.isDevice) {
      console.log("❌ Must use physical device");
      return null;
    }

    // =====================================
    // 🔐 PERMISSION CHECK
    // =====================================
    let { status } =
      await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();

      status = newStatus;
    }

    if (status !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    // =====================================
    // 📲 GET TOKEN
    // =====================================
    const tokenData =
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID, // 🔥 IMPORTANT PROD
      });

    const token = tokenData.data;

    if (!token) {
      console.log("❌ No push token generated");
      return null;
    }

    console.log("📲 PUSH TOKEN:", token);

    // =====================================
    // 💾 SAVE TO SUPABASE
    // =====================================
    const { error } = await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);

    if (error) {
      console.log("❌ SAVE TOKEN ERROR:", error.message);
    }

    return token;

  } catch (e) {
    console.log("❌ PUSH ERROR:", e.message);
    return null;
  }
}

// =====================================
// 🚀 SEND PUSH NOTIFICATION (PRO)
// =====================================
export async function sendPushNotification(
  token,
  title,
  body,
  data = {}
) {
  try {
    if (!token) return;

    const message = {
      to: token,
      sound: "default",
      title,
      body,
      data,
    };

    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();

    console.log("🔔 PUSH RESULT:", result);

    return result;

  } catch (e) {
    console.log("❌ SEND NOTIF ERROR:", e.message);
    return null;
  }
}