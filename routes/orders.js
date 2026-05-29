     import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📦 GET ALL ORDERS
// =====================================
router.get("/", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

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
// 📦 GET SINGLE ORDER
// =====================================
router.get("/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
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
// 🚚 UPDATE ORDER STATUS
// =====================================
router.put("/:id/status", async (req, res) => {
  try {

    const { id } = req.params;

    const { status } = req.body;

    const { error } = await supabase
      .from("orders")
      .update({
        status,
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
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

export default router;