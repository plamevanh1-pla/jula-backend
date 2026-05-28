import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📦 GET ALL ORDERS (ADMIN)
// =====================================
router.get("/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      orders: data,
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =====================================
// 📦 GET SINGLE ORDER
// =====================================
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      order: data,
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =====================================
// 🚚 UPDATE ORDER STATUS
// =====================================
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      message: "Status updated",
      order: data,
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;