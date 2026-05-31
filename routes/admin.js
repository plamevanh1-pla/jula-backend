  import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 🔐 ADMIN AUTH (PRODUCTION SAFE)
// =====================================
const isAdmin = async (req, res, next) => {

  try {

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // =====================================
    // 🔐 CHECK ROLE FROM DATABASE (IMPORTANT UPGRADE)
    // =====================================
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    req.userId = userId;
    next();

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// =====================================
// 📦 GET ALL ORDERS (ADMIN)
// =====================================
router.get("/orders", isAdmin, async (req, res) => {

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
router.get("/orders/:id", isAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const { data, error } = await supabase
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
// 🚚 UPDATE ORDER STATUS (WITH AUDIT LOG)
// =====================================
router.put("/orders/:id/status", isAdmin, async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

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

    // =====================================
    // 🚚 UPDATE ORDER
    // =====================================
    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // =====================================
    // 🧾 AUDIT LOG (IMPORTANT PRO FEATURE)
    // =====================================
    await supabase.from("admin_logs").insert([
      {
        admin_id: req.userId,
        action: "UPDATE_ORDER_STATUS",
        target_id: id,
        new_value: status,
        created_at: new Date().toISOString(),
      },
    ]);

    return res.json({
      success: true,
      message: "Status updated",
      order: data,
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

export default router;