   import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 📍 UPDATE GPS POSITION (LIVE)
// =====================================
router.post("/update", async (req, res) => {

  try {

    const {
      order_id,
      driver_id,
      lat,
      lng,
    } = req.body;

    if (
      !order_id ||
      !driver_id ||
      !lat ||
      !lng
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing data",
      });
    }

    // VALIDATION SAFE
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    const { error } = await supabase
      .from("delivery_tracking")

      .upsert({
        order_id,
        driver_id,
        lat: latitude,
        lng: longitude,
        updated_at:
          new Date().toISOString(),
      });

    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "GPS updated",
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =====================================
// 📍 GET TRACKING BY ORDER
// =====================================
router.get("/:order_id", async (req, res) => {

  try {

    const { order_id } =
      req.params;

    const { data, error } =
      await supabase
        .from("delivery_tracking")
        .select("*")
        .eq("order_id", order_id)
        .maybeSingle();

    if (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.json({
      success: true,
      tracking: data || null,
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

export default router;