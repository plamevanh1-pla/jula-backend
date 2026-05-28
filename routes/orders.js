    import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const router = express.Router();

// =====================================
// 🔥 SUPABASE CLIENT
// =====================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📦 GET ORDERS BY USER (SECURE)
// =====================================
router.get("/", async (req, res) => {
  try {
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      orders: data || [],
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// =====================================
// 📦 CREATE ORDER (SECURE)
// =====================================
router.post("/create", async (req, res) => {
  try {
    const {
      buyer_id,
      seller_id,
      total_price,
      payment_token,
    } = req.body;

    if (!buyer_id || !seller_id || !total_price) {
      return res.status(400).json({
        success: false,
        error: "Missing fields",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          buyer_id,
          seller_id,
          total_price,
          payment_token: payment_token || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
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
      error: "Server error",
    });
  }
});

// =====================================
// 🚚 UPDATE ORDER STATUS (SECURE)
// =====================================
router.put("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
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
      error: "Server error",
    });
  }
});

export default router; 