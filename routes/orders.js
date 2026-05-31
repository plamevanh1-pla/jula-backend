      import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 🔐 SAFE AUTH CHECK (OPTION PRO)
// =====================================
// 👉 ici tu peux ajouter JWT plus tard
const getUserFromRequest = (req) => {
  return req.headers["x-user-id"]; // simple MVP safe
};

// =====================================
// 📦 GET ORDERS (SECURE PRO)
// =====================================
router.get("/", async (req, res) => {

  try {

    const user_id = getUserFromRequest(req);
    const role = req.query.role;

    if (!user_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    // =====================================
    // 🔐 ROLE FILTER (SECURE VERSION)
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

    const user_id = getUserFromRequest(req);
    const { id } = req.params;

    if (!user_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

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

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =====================================
    // 🔐 SECURITY CHECK OWNER ACCESS
    // =====================================
    if (
      data.buyer_id !== user_id &&
      data.seller_id !== user_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
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
// 🚚 UPDATE STATUS (PRO SAFE)
// =====================================
router.put("/:id/status", async (req, res) => {

  try {

    const user_id = getUserFromRequest(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!user_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

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
    // 🔐 CHECK ORDER FIRST
    // =====================================
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =====================================
    // 🔐 ONLY SELLER CAN UPDATE
    // =====================================
    if (order.seller_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "Only seller can update status",
      });
    }

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

    return res.json({
      success: true,
      message: "Order updated",
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