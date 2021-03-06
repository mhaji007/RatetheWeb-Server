// File for housing all category routes

const express = require("express");
const router = express.Router();

// Import validators
const {
  categoryCreateValidator,
  categoryUpdateValidator,
} = require("../validators/category");

const { runValidation } = require("../validators");

// Import middlewares
const { adminMiddleWare, requireSignin } = require("../controllers/auth");

// Import controllers

const {
  create,
  list,
  read,
  update,
  remove,
} = require("../controllers/category");

// Routes

router.post(
  "/category",
  categoryCreateValidator,
  runValidation,
  requireSignin,
  adminMiddleWare,
  create
);
router.get("/categories", list);
router.post("/category/:slug", read);
router.put(
  "/category/:slug",
  categoryUpdateValidator,
  runValidation,
  requireSignin,
  adminMiddleWare,
  update
);
router.delete("/category/:slug", requireSignin, adminMiddleWare, remove);

module.exports = router;
