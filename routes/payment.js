       import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 💳 CREATE PAYMENT ORDER (PRO)
// =====================================
router.post("/create", async (req, res) => {

  try {

    const { user_id, cart } = req.body;

    if (!user_id || !cart?.length) {

      return res.status(400).json({
        success: false,
        message: "Invalid cart",
      });
    }

    // =====================================
    // 📦 CALCUL SERVER PRICE (IMPORTANT)
    // =====================================
    let total_price = 0;

    for (const item of cart) {

      total_price +=
        item.price * item.quantity;
    }

    // =====================================
    // 📦 CREATE ORDER
    // =====================================
    const { data: order, error } =
      await supabase

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

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // =====================================
    // 📦 INSERT ITEMS (WITH SELLER ID)
    // =====================================
    const items = cart.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemError } =
      await supabase
        .from("order_items")
        .insert(items);

    if (itemError) {

      return res.status(500).json({
        success: false,
        message:
          itemError.message,
      });
    }

    // =====================================
    // 💳 PAYMENT URL (PAYDUNYA)
    // =====================================
    const payment_url =
      `https://paydunya.com/checkout/${order.id}`;

    // =====================================
    // 🚀 RESPONSE
    // =====================================
    return res.json({
      success: true,
      order_id: order.id,
      total_price,
      payment_url,
    });

  } catch (e) {

    console.log(
      "PAYMENT ERROR:",
      e.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;