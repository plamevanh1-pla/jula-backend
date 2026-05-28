 import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

// =====================================
// 🔥 SUPABASE
// =====================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📦 VALID STATUS
// =====================================
const allowedStatus = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

// =====================================
// 🚚 GET TRACKING (PRO)
// =====================================
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    return res.json({
      success: true,
      tracking: {
        order_id: data.id,
        status: data.status,
        total_price: data.total_price,
        created_at: data.created_at,
      },
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "Tracking failed",
    });
  }
});

// =====================================
// 🚚 UPDATE TRACKING (SECURE)
// =====================================
router.put("/update/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // 🔐 VALIDATION STATUS
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    // 🔥 UPDATE ORDER
    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      order: data,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "Update tracking failed",
    });
  }
});

export default router;