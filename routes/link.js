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
const {
  authMiddleWare,
  adminMiddleWare,
  requireSignin,
  CanUpdateDeleteLink,
} = require("../controllers/auth");

// Import controllers

const {
  create,
  list,
  read,
  update,
  remove,
  clickCount,
  popular,
  popularInCategory
} = require("../controllers/link");

// Routes

// Note: put absolute routes before
// routes with route parameters

router.post(
  "/link",
  linkCreateValidator,
  runValidation,
  requireSignin,
  authMiddleWare,
  create
);

router.post("/links", requireSignin, adminMiddleWare, list);

router.put("/click-count", clickCount);

router.get('/link/popular', popular)
router.get('/link/popular/:category', popularInCategory)

router.get("/link/:id", read);
router.put(
  "/link/:id",
  linkUpdateValidator,
  runValidation,
  requireSignin,
  authMiddleWare,
  CanUpdateDeleteLink,
  update
);
router.put(
  "/link/admin/:id",
  linkUpdateValidator,
  runValidation,
  requireSignin,
  adminMiddleWare,
  update
);
router.delete("/link/:id", requireSignin, authMiddleWare,CanUpdateDeleteLink, remove);
router.delete("/link/admin/:id", requireSignin, adminMiddleWare, remove);

module.exports = router;
