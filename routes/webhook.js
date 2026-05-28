     import { createClient } from "@supabase/supabase-js";
import express from "express";
import { sendPushNotification } from "../lib/notifications.js";

const router = express.Router();

// =====================================
// 🔐 SUPABASE CLIENT (SERVICE ROLE)
// =====================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 💳 PAYDUNYA WEBHOOK
// =====================================
router.post("/paydunya", async (req, res) => {
  try {
    const data = req.body;

    console.log("📩 WEBHOOK RECEIVED:", data);

    const status = data?.data?.status;
    const token = data?.data?.token;

    // =====================================
    // ❌ VALIDATION
    // =====================================
    if (!token) {
      console.log("❌ Missing token");
      return res.sendStatus(400);
    }

    if (status !== "completed") {
      console.log("⏳ Payment not completed");
      return res.sendStatus(200);
    }

    // =====================================
    // 🔍 CHECK ORDER EXISTS
    // =====================================
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_token", token)
      .single();

    if (!existingOrder) {
      console.log("❌ Order not found");
      return res.sendStatus(404);
    }

    // =====================================
    // 📦 UPDATE ORDER STATUS
    // =====================================
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("payment_token", token)
      .select()
      .single();

    if (error) {
      console.log("❌ ORDER UPDATE ERROR:", error);
      return res.sendStatus(500);
    }

    console.log("✅ ORDER PAID:", order.id);

    // =====================================
    // 👤 GET PUSH TOKENS
    // =====================================
    const { data: buyer } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", order.buyer_id)
      .single();

    const { data: seller } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", order.seller_id)
      .single();

    // =====================================
    // 📲 BUYER NOTIFICATION
    // =====================================
    if (buyer?.push_token) {
      await sendPushNotification(
        buyer.push_token,
        "💳 Paiement confirmé",
        "Votre commande est validée 🎉",
        { orderId: order.id }
      );
    }

    // =====================================
    // 📲 SELLER NOTIFICATION
    // =====================================
    if (seller?.push_token) {
      await sendPushNotification(
        seller.push_token,
        "💰 Nouvelle vente",
        "Une commande vient d’être payée 🔥",
        { orderId: order.id }
      );
    }

    // =====================================
    // ✅ RESPONSE
    // =====================================
    return res.sendStatus(200);

  } catch (e) {
    console.log("🔥 WEBHOOK ERROR:", e.message);
    return res.sendStatus(500);
  }
});

export default router;