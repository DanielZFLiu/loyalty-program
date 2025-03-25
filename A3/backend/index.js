#!/usr/bin/env node
"use strict";

const port = (() => {
  const args = process.argv;

  if (args.length !== 3) {
    console.error("usage: node index.js port");
    process.exit(1);
  }

  const num = parseInt(args[2], 10);
  if (isNaN(num)) {
    console.error("error: argument must be an integer.");
    process.exit(1);
  }

  return num;
})();

// imports
const user = require("./controller/user");
const userMe = require("./controller/userMe");
const auth = require("./controller/auth");
const transaction = require("./controller/transaction");
const eventController = require("./controller/event");
const promotion = require("./controller/promotion");
const { authenticate } = require("./middleware/jwt");
const { requireAuth } = require("./middleware/auth");
const { testLog } = require("./middleware/testLog");
const multer = require("multer");
const path = require("path");
const express = require("express");
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// #region user routes
app.post("/users", authenticate, requireAuth("CASHIER"), user.registerUser);
app.get("/users", authenticate, requireAuth("MANAGER"), user.listUsers);
app.all("/users", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});

const upload = multer({
  dest: path.join(__dirname, "uploads/avatars"),
});

app.get("/users/me", authenticate, requireAuth("REGULAR"), userMe.getMe);
app.patch(
  "/users/me",
  authenticate,
  requireAuth("REGULAR"),
  upload.single("avatar"),
  userMe.updateMe
);
app.all("/users/me", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});


app.patch(
  "/users/me/password",
  authenticate,
  requireAuth("REGULAR"),
  userMe.updatePassword
);
app.all("/users/me/password", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});


app.post(
  "/users/me/transactions",
  authenticate,
  requireAuth("REGULAR"),
  transaction.createRedemptionTransaction
);
app.get(
  "/users/me/transactions",
  authenticate,
  requireAuth("REGULAR"),
  transaction.listMyTransactions
);
app.all("/users/me/transactions", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});


app.get("/users/:userId", authenticate, requireAuth("CASHIER"), user.getUser);
app.patch(
  "/users/:userId",
  authenticate,
  requireAuth("MANAGER"),
  user.updateUser
);
app.all("/users/:userId", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});

// #endregion

// #region auth routes
app.post("/auth/tokens", auth.generateToken);
app.all("/auth/tokens", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});

app.post("/auth/resets", auth.requestReset);
app.all("/auth/resets", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});

app.post("/auth/resets/:resetToken", auth.resetPassword);
app.all("/auth/resets/:resetToken", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});
// #endregion

// #region transactions routes
app.post(
  "/transactions",
  authenticate,
  (req, res, next) => {
    // dispatch based on transaction type
    if (req.body.type === "adjustment") {
      return requireAuth("MANAGER")(req, res, next);
    } else if (req.body.type === "purchase") {
      return requireAuth("CASHIER")(req, res, next);
    } else {
      return res.status(400).json({ error: "invalid transaction type" });
    }
  },
  (req, res) => {
    if (req.body.type === "adjustment") {
      return transaction.createAdjustmentTransaction(req, res);
    } else if (req.body.type === "purchase") {
      return transaction.createPurchaseTransaction(req, res);
    }
  }
);
app.get(
  "/transactions",
  authenticate,
  requireAuth("MANAGER"),
  transaction.listTransactions
);
app.all("/transactions", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});

app.get(
  "/transactions/:transactionId",
  authenticate,
  requireAuth("MANAGER"),
  transaction.getTransaction
);
app.patch(
  "/transactions/:transactionId/suspicious",
  authenticate,
  requireAuth("MANAGER"),
  transaction.updateTransactionSuspicious
);
app.patch(
  "/transactions/:transactionId/processed",
  authenticate,
  requireAuth("CASHIER"),
  transaction.processRedemptionTransaction
)

app.post(
  "/users/:userId/transactions",
  authenticate,
  requireAuth("REGULAR"),
  transaction.createTransferTransaction
);
app.all("/users/:userId/transactions", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});
// #endregion

// #region events routes
app.post(
  "/events",
  authenticate,
  requireAuth("MANAGER"),
  eventController.createEvent
);
app.get(
  "/events",
  authenticate,
  requireAuth("REGULAR"),
  eventController.listEvents
);
app.get(
  "/events/:eventId",
  authenticate,
  requireAuth("REGULAR"),
  eventController.getEvent
);
app.patch(
  "/events/:eventId",
  authenticate,
  requireAuth("REGULAR"),
  eventController.updateEvent
);
app.delete(
  "/events/:eventId",
  authenticate,
  requireAuth("MANAGER"),
  eventController.deleteEvent
);
app.post(
  "/events/:eventId/organizers",
  authenticate,
  requireAuth("MANAGER"),
  eventController.addEventOrganizer
);
app.delete(
  "/events/:eventId/organizers/:userId",
  authenticate,
  requireAuth("MANAGER"),
  eventController.removeEventOrganizer
);
app.post(
  "/events/:eventId/guests",
  authenticate,
  requireAuth("REGULAR"),
  eventController.addEventGuest
);
app.post(
  "/events/:eventId/guests/me",
  authenticate,
  requireAuth("REGULAR"),
  eventController.addMyGuest
);
app.delete(
  "/events/:eventId/guests/me",
  authenticate,
  requireAuth("REGULAR"),
  eventController.removeMyGuest
);
app.delete(
  "/events/:eventId/guests/:userId",
  authenticate,
  requireAuth("MANAGER"),
  eventController.removeEventGuest
);
app.post(
  "/events/:eventId/transactions",
  authenticate,
  requireAuth("REGULAR"),
  eventController.createEventTransaction
);
app.all("/events", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});
// #endregion

// #region promotions routes
app.post(
  "/promotions",
  authenticate,
  requireAuth("MANAGER"),
  promotion.createPromotion
);
app.get(
  "/promotions",
  authenticate,
  requireAuth("REGULAR"),
  promotion.getPromotions
);
app.get(
  "/promotions/:promotionId",
  authenticate,
  requireAuth("REGULAR"),
  promotion.getPromotion
);
app.patch(
  "/promotions/:promotionId",
  authenticate,
  requireAuth("MANAGER"),
  promotion.updatePromotion
);
app.delete(
  "/promotions/:promotionId",
  authenticate,
  requireAuth("MANAGER"),
  promotion.deletePromotion
);
app.all("/promotions", (_req, res) => {
  res.status(405).json({ error: "method not allowed" });
});
// #endregion

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", (err) => {
  console.error(`cannot start server: ${err.message}`);
  process.exit(1);
});
