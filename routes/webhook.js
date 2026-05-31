       import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 🔐 VERIFY PAYDUNYA SIGNATURE (ROBUST)
// =====================================
const verifySignature = (body, signature) => {

  try {

    if (!signature || !body) return false;

    const secret = process.env.PAYDUNYA_SECRET;

    const payload = typeof body === "string"
      ? body
      : JSON.stringify(body);

    const hash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return hash === signature;

  } catch (e) {
    console.log("SIGNATURE ERROR:", e.message);
    return false;
  }
};

// =====================================
// 🔔 PAYDUNYA WEBHOOK (PRODUCTION SAFE)
// =====================================
router.post("/paydunya", async (req, res) => {

  try {

    const signature = req.headers["x-paydunya-signature"];

    const body = req.body;

    console.log("🔔 WEBHOOK RECEIVED:", body);

    // =====================================
    // 🔐 SECURITY CHECK
    // =====================================
    if (!verifySignature(body, signature)) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const invoice = body?.invoice;
    const status = body?.status;

    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: "Missing invoice",
      });
    }

    // =====================================
    // 📦 FIND ORDER
    // =====================================
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", invoice)
      .maybeSingle();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =====================================
    // 💳 PAYMENT SUCCESS
    // =====================================
    if (status === "completed") {

      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice);

      console.log("✅ PAYMENT CONFIRMED:", invoice);
    }

    // =====================================
    // ❌ PAYMENT FAILED
    // =====================================
    if (status === "cancelled") {

      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice);

      console.log("❌ PAYMENT FAILED:", invoice);
    }

    // =====================================
    // 🚀 RESPONSE ALWAYS FAST (IMPORTANT)
    // =====================================
    return res.json({
      success: true,
      message: "Webhook processed",
    });

  } catch (e) {

    console.log("WEBHOOK ERROR:", e.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;