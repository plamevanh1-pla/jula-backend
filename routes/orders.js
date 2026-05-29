      import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📦 GET ORDERS (FILTERED SAFE)
// =====================================
router.get("/", async (req, res) => {

  try {

    const { role, user_id } = req.query;

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    // =====================================
    // 🔐 ROLE FILTER
    // =====================================
    if (role === "client") {

      query = query.eq("buyer_id", user_id);
    }

    if (role === "seller") {

      query = query.eq("seller_id", user_id);
    }

    const { data, error } = await query;

    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      orders: data,
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =====================================
// 📦 GET SINGLE ORDER (SECURE)
// =====================================
router.get("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const { data, error } =
      await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order: data,
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =====================================
// 🚚 UPDATE ORDER STATUS (PRO SAFE)
// =====================================
router.put("/:id/status", async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    // =====================================
    // 🔐 VALID STATUS ONLY
    // =====================================
    const allowedStatus = [
      "pending",
      "accepted",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {

      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Order updated",
      status,
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

export default router; 