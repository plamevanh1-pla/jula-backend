  import supabase from "./supabase.js";

// =====================================
// 🚀 SEND PUSH NOTIFICATION (SERVER SAFE)
// =====================================
export async function sendPushNotification(
  token,
  title,
  body,
  data = {}
) {
  try {
    if (!token) return null;

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