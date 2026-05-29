      import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import express from "express";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================
// 🔐 VERIFY PAYDUNYA SIGNATURE (IMPORTANT)
// =====================================
const verifySignature = (body, signature) => {

  const secret = process.env.PAYDUNYA_SECRET;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("hex");

  return hash === signature;
};

// =====================================
// 🔔 PAYDUNYA WEBHOOK
// =====================================
router.post("/paydunya", async (req, res) => {

  try {

    const signature =
      req.headers["x-paydunya-signature"];

    const body = req.body;

    console.log(
      "🔔 WEBHOOK:",
      body
    );

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
    // 📦 CHECK ORDER EXISTS
    // =====================================
    const { data: order } =
      await supabase
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

      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", invoice);

      if (error) {

        console.log(
          "UPDATE ERROR:",
          error.message
        );
      }

      console.log(
        "✅ PAYMENT OK:",
        invoice
      );
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
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", invoice);

      console.log(
        "❌ PAYMENT FAILED:",
        invoice
      );
    }

    // =====================================
    // 🚀 RESPONSE SAFE
    // =====================================
    return res.json({
      success: true,
      message: "Webhook processed",
    });

  } catch (e) {

    console.log(
      "WEBHOOK ERROR:",
      e.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;