     import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import express from "express";

const router = express.Router();

// =====================================
// 🔥 SUPABASE CLIENT (BACKEND SAFE)
// =====================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 💳 CREATE PAYMENT (PAYDUNYA)
// =====================================
router.post("/create", async (req, res) => {

  try {

    const {
      amount,
      buyer_id,
      seller_id,
      cart_items
    } = req.body;

    console.log("💳 PAYMENT REQUEST:", req.body);

    // =====================================
    // ❌ VALIDATION
    // =====================================
    if (!amount || !buyer_id) {
      return res.status(400).json({
        success: false,
        error: "Missing fields"
      });
    }

    // =====================================
    // 🚀 PAYDUNYA REQUEST
    // =====================================
    const response = await axios.post(
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
      {
        invoice: {
          total_amount: amount,
          description: "Marketplace Order"
        },
        store: {
          name: "Jula Marketplace"
        },
        actions: {
          callback_url: process.env.CALLBACK_URL,
          cancel_url: process.env.CANCEL_URL
        }
      },
      {
        headers: {
          "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY,
          "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY,
          "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data;

    console.log("💳 PAYDUNYA RESPONSE:", data);

    // =====================================
    // 🔑 EXTRACT TOKEN + URL (FIXED)
    // =====================================
    const token = data?.response_text?.token;

    const paymentUrl =
      data?.response_text?.checkout_url;

    if (!token || !paymentUrl) {
      return res.status(400).json({
        success: false,
        error: "Invalid Paydunya response",
        raw: data
      });
    }

    // =====================================
    // 📦 CREATE ORDER (PENDING)
    // =====================================
    const { data: order, error } = await supabase
      .from("orders")
      .insert([
        {
          buyer_id,
          seller_id,
          total_price: amount,
          status: "pending",
          payment_token: token
        }
      ])
      .select()
      .single();

    if (error) {
      console.log("❌ ORDER ERROR:", error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // =====================================
    // 🛒 ORDER ITEMS SAFE INSERT
    // =====================================
    if (Array.isArray(cart_items) && cart_items.length > 0) {

      const items = cart_items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        price: item.price || 0
      }));

      const { error: itemsError } =
        await supabase.from("order_items").insert(items);

      if (itemsError) {
        console.log("⚠️ ITEMS ERROR:", itemsError);
      }
    }

    // =====================================
    // 🚀 RESPONSE FRONTEND
    // =====================================
    return res.json({
      success: true,
      url: paymentUrl,
      token,
      order_id: order.id
    });

  } catch (error) {

    console.log(
      "🔥 PAYMENT ERROR:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: "Server error payment"
    });
  }
});

export default router;