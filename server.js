     import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

// =====================================
// 🚀 DEBUG (RENDER)
// =====================================
console.log("🚀 SERVER LOADING...");
console.log("NODE VERSION:", process.version);
console.log("ENV:", process.env.NODE_ENV);

// =====================================
// 🚀 ROUTES
// =====================================
import etaRoutes from "./routes/eta.js";
import ordersRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import trackingRoutes from "./routes/tracking.js";
import webhookRoutes from "./routes/webhook.js";

const app = express();

// =====================================
// 🔐 MIDDLEWARE SECURITY
// =====================================
app.use(cors({
origin: true,
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
app.use("/eta", etaRoutes);

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
// 🚀 SERVER START
// =====================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log("🚀 Server running on port:", PORT);
console.log("📦 ENV:", process.env.NODE_ENV || "development");
});

// =====================================
// 💥 ERROR HANDLING GLOBAL
// =====================================
process.on("uncaughtException", (err) => {
console.log("❌ UNCAUGHT ERROR:", err);
});

process.on("unhandledRejection", (err) => {
console.log("❌ PROMISE ERROR:", err);
});