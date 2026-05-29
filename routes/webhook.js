     import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

// =====================================
// 🔥 SUPABASE
// =====================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 🔔 PAYDUNYA WEBHOOK
// =====================================
router.post("/paydunya", async (req, res) => {

  try {

    console.log("🔔 PAYDUNYA WEBHOOK:", req.body);

    const invoice = req.body?.invoice;
    const status = req.body?.status;

    // =====================================
    // ⚠️ SECURITY CHECK
    // =====================================
    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: "Missing invoice",
      });
    }

    // =====================================
    // 💳 PAYMENT SUCCESS
    // =====================================
    if (status === "completed") {

      // =====================================
      // 🔥 UPDATE ORDER
      // =====================================
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
        })
        .eq("id", invoice);

      if (error) {
        console.log("❌ ORDER UPDATE ERROR:", error.message);
      }

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
        })
        .eq("id", invoice);

      console.log("❌ PAYMENT FAILED:", invoice);
    }

    // =====================================
    // 🚀 RESPONSE
    // =====================================
    return res.json({
      success: true,
      message: "Webhook received",
    });

  } catch (e) {

    console.log("❌ WEBHOOK ERROR:", e.message);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

export default router;