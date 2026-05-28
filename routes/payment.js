      import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 💳 CREATE PAYMENT
// =====================================
router.post("/create", async (req, res) => {
  try {
    const { user_id, cart, total_price } = req.body;

    if (!user_id || !cart || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
      });
    }

    // =====================================
    // 📦 CREATE ORDER IN SUPABASE
    // =====================================
    const { data: order, error } = await supabase
      .from("orders")
      .insert([
        {
          buyer_id: user_id,
          total_price,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("ORDER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // =====================================
    // 💳 PAYDUNYA PAYMENT (SIMPLIFIED)
    // =====================================
    const payment_url =
      `https://paydunya.com/checkout/${order.id}`;

    // =====================================
    // 📦 SAVE ORDER ITEMS (OPTIONAL)
    // =====================================
    for (const item of cart) {
      await supabase.from("order_items").insert([
        {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
        },
      ]);
    }

    // =====================================
    // 🚀 RESPONSE TO FRONTEND
    // =====================================
    return res.json({
      success: true,
      order,
      payment_url,
    });

  } catch (e) {
    console.log("PAYMENT ERROR:", e.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;