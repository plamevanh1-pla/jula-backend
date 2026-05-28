  import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// =====================================
// 🔥 LOAD ENV
// =====================================
dotenv.config();

// =====================================
// 🔥 ROUTES
// =====================================
import ordersRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import trackingRoutes from "./routes/tracking.js";
import webhookRoutes from "./routes/webhook.js";

// =====================================
// 🚀 INIT APP
// =====================================
const app = express();

// =====================================
// 🔥 MIDDLEWARES (PRODUCTION SAFE)
// =====================================
app.use(cors());

// ⚠️ IMPORTANT: increase limit for mobile apps + payments
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================
// 🟢 HEALTH CHECK
// =====================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Marketplace Backend PRO is running",
    status: "OK",
    time: new Date().toISOString(),
  });
});

// =====================================
// 💳 PAYMENT ROUTES
// =====================================
app.use("/payment", paymentRoutes);

// =====================================
// 📦 ORDERS ROUTES
// =====================================
app.use("/orders", ordersRoutes);

// =====================================
// 🚚 TRACKING ROUTES
// =====================================
app.use("/tracking", trackingRoutes);

// =====================================
// 🔔 WEBHOOK ROUTES
// =====================================
app.use("/webhook", webhookRoutes);

// =====================================
// ❌ 404 HANDLER (IMPORTANT PROD)
// =====================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// =====================================
// 🚀 START SERVER
// =====================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});