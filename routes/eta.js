  import express from "express";

const router = express.Router();

// =====================================
// 🚀 GOOGLE MAPS ETA (UBER STYLE PRO)
// =====================================
router.post("/", async (req, res) => {
try {
const {
origin_lat,
origin_lng,
dest_lat,
dest_lng
} = req.body;

if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
  return res.status(400).json({
    success: false,
    message: "Missing coordinates",
  });
}

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  return res.status(500).json({
    success: false,
    message: "Google Maps API key missing",
  });
}

const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin_lat},${origin_lng}&destination=${dest_lat},${dest_lng}&key=${apiKey}`;

const response = await fetch(url);
const data = await response.json();

if (!data.routes || data.routes.length === 0) {
  return res.status(400).json({
    success: false,
    message: "No route found",
  });
}

const leg = data.routes[0].legs[0];

return res.json({
  success: true,
  distance: leg.distance.text,
  distance_value: leg.distance.value,
  duration: leg.duration.text,
  duration_value: leg.duration.value,
  start_address: leg.start_address,
  end_address: leg.end_address,
  polyline: data.routes[0].overview_polyline.points,
});

} catch (e) {
console.log("ETA ERROR:", e.message);

return res.status(500).json({
  success: false,
  message: "Server error",
});

}
});

export default router;