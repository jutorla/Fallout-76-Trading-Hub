const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./db");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function isAdmin(req) {
  const token = req.get("x-admin-token") || req.query.token;
  return ADMIN_TOKEN && token === ADMIN_TOKEN;
}

app.get("/trades", (req, res) => {
  const all = db.getTrades();
  res.json(all);
});

app.post("/trades", (req, res) => {
  const t = req.body;
  if (!t || !t.type) return res.status(400).json({ error: "Invalid trade" });

  if (!t.quantity1 || !t.item1)
    return res
      .status(400)
      .json({ error: "Quantity 1 and Item 1 are required" });
  if (!t.description1 || !t.description1.trim())
    return res.status(400).json({ error: "Description 1 is required" });
  if (!t.quantity2 || !t.item2)
    return res
      .status(400)
      .json({ error: "Quantity 2 and Item 2 are required" });
  if (!t.description2 || !t.description2.trim())
    return res.status(400).json({ error: "Description 2 is required" });

  if (!t.ingameUser && !t.discordUser)
    return res.status(400).json({
      error: "Provide at least an in-game username or a Discord username",
    });
  const trade = {
    id: Date.now().toString(),
    type: t.type,
    quantity1: t.quantity1 || "",
    item1: t.item1 || "",
    description1: t.description1 || "",
    quantity2: t.quantity2 || "",
    item2: t.item2 || "",
    description2: t.description2 || "",
    ingameUser: t.ingameUser || "",
    discordUser: t.discordUser || "",
    createdAt: new Date().toISOString(),
    creatorId:
      req.cookies && req.cookies.creatorId
        ? req.cookies.creatorId
        : t.creatorId || null,
  };
  db.createTrade(trade);
  res.status(201).json(trade);
});

app.delete("/trades/:id", (req, res) => {
  const id = req.params.id;
  const requester = req.cookies && req.cookies.creatorId;
  if (!requester) return res.status(403).json({ error: "No creator cookie" });

  const trade = db.getTradeById(id);
  if (!trade) return res.status(404).json({ error: "Not found" });
  if (trade.creatorId !== requester)
    return res.status(403).json({ error: "Not authorized" });

  db.deleteTrade(id);
  res.json({ ok: true });
});

app.get("/admin/db", (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const payload = {
      trades: db.getTrades(),
    };
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to retrieve DB info" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`),
);
