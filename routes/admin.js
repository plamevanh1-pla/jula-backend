 import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 🔐 ADMIN MIDDLEWARE (BASIC SAFE CHECK)
// =====================================
const isAdmin = (req, res, next) => {

  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_SECRET) {

    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};

// =====================================
// 📦 GET ALL ORDERS (ADMIN)
// =====================================
router.get("/orders", isAdmin, async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

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
// 🚚 UPDATE ORDER STATUS (SAFE)
// =====================================
router.put("/orders/:id/status", isAdmin, async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    // =====================================
    // 🔐 VALID STATUS CHECK
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

    const { data, error } =
      await supabase
        .from("orders")
        .update({
          status,
          updated_at:
            new Date().toISOString(),
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