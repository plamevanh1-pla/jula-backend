 import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

// =====================================
// 🔥 SUPABASE CONNECTION
// =====================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📍 UPDATE LIVE GPS POSITION
// =====================================
router.post("/update", async (req, res) => {
  try {

    const { order_id, lat, lng } = req.body;

    if (!order_id || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Missing data",
      });
    }

    const { error } = await supabase
      .from("delivery_tracking")
      .upsert([
        {
          order_id,
          lat,
          lng,
          updated_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "GPS updated successfully",
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =====================================
// 📍 GET LIVE POSITION BY ORDER ID
// =====================================
router.get("/:order_id", async (req, res) => {
  try {

    const { order_id } = req.params;

    const { data, error } = await supabase
      .from("delivery_tracking")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      tracking: data,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

export default router;