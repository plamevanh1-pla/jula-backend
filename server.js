   import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// =====================================
// 🔥 ENV
// =====================================
dotenv.config();

// =====================================
// 🚀 ROUTES
// =====================================
import ordersRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import trackingRoutes from "./routes/tracking.js";
import webhookRoutes from "./routes/webhook.js";

// =====================================
// 🚀 APP INIT
// =====================================
const app = express();

// =====================================
// 🔥 MIDDLEWARE SECURITY
// =====================================
app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================
// 🟢 HEALTH CHECK
// =====================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Marketplace Backend PRO Running",
    status: "OK",
    time: new Date().toISOString(),
  });
});

// =====================================
// 📦 ROUTES
// =====================================
app.use("/orders", ordersRoutes);
app.use("/payment", paymentRoutes);
app.use("/tracking", trackingRoutes);
app.use("/webhook", webhookRoutes);

// =====================================
// ❌ 404 HANDLER
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

  console.log("🚀 Server running on port:", PORT);
  console.log("📦 ENV:", process.env.NODE_ENV || "development");

}); 