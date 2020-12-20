// File for housing all user routes
const express = require("express");
const router = express.Router();

// Import middlewares
const {
  requireSignin,
  authMiddleWare,
  adminMiddleWare,
} = require("../controllers/auth");

// Import controllers
const {read} = require("../controllers/user");


// Routes

// If we want to display a certain page to either
// admin or subscriber(user) we will make use
// of the following endpoints before displaying
// the page to the user

// requireSignin makes user's id available on req
// and in turn authMiddleware will make user's information
// available on req.profile and only then read controller
// is run
router.get("/user", requireSignin, authMiddleWare, read);
router.get("/admin", requireSignin, adminMiddleWare, read);


// In node any file created is
// treated as a module
module.exports = router;
