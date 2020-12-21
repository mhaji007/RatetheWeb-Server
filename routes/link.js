// File for housing all category routes

const express = require("express");
const router = express.Router();

// Import validators
const {
  linkCreateValidator,
  linkUpdateValidator,
} = require("../validators/link");

const { runValidation } = require("../validators");

// Import middlewares
const { authMiddleWare, requireSignin } = require("../controllers/auth");

// Import controllers

const {
  create,
  list,
  read,
  update,
  remove,
} = require("../controllers/link");

// Routes

router.post(
  "/link",
  linkCreateValidator,
  runValidation,
  requireSignin,
  authMiddleWare,
  create
);
router.get("/links", list);
router.get("/link/:slug", read);
router.put(
  "/link/:slug",
  linkUpdateValidator,
  runValidation,
  requireSignin,
  authMiddleWare,
  create
);
router.delete("/link/:slug", requireSignin, authMiddleWare, remove);

module.exports = router;
