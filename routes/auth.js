// File for housing all authentication routes

const express = require("express");
const router = express.Router();

// import validators
const { userRegisterValidator } = require("../validators/auth");
const { runValidation } = require("../validators");

// Import controllers
const { register } = require("../controllers/auth");

// Routes

// Apply validation before request reaches the model
router.post("/register", userRegisterValidator, runValidation, register);

// In node any file created is
// treated as a module
module.exports = router;
