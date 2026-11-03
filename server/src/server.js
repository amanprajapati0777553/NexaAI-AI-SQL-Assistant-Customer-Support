import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });
const User = mongoose.model("User", schema);

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
}
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub).select("_id name email role");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch { return res.status(401).json({ message: "Invalid or expired token" }); }
}
app.get("/health", (_req, res) => res.json({ status: "ok", service: "NexaAI Express API" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || typeof password !== "string" || password.length < 8)
      return res.status(400).json({ message: "Name, email, and password (8+ characters) required" });
    const normalized = email.trim().toLowerCase();
    if (await User.findOne({ email: normalized })) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name: name.trim(), email: normalized, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch { res.status(500).json({ message: "Registration failed" }); }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash)))
      return res.status(401).json({ message: "Email or password is incorrect" });
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch { res.status(500).json({ message: "Login failed" }); }
});
app.get("/api/auth/me", auth, (req, res) => res.json({ user: req.user }));

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("Set MONGODB_URI and JWT_SECRET in server/.env"); process.exit(1);
}
const port = Number(process.env.PORT || 5000);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`NexaAI API running on ${port}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
