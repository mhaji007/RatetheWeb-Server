// File for housing all authentication routes

const express = require("express");
const router = express.Router();

// Import validators
const { userRegisterValidator, userLoginValidator } = require("../validators/auth");
const { runValidation } = require("../validators");

// Import controllers
const { register, registerActivate, login } = require("../controllers/auth");

// Routes

// Register route

// Takes user credentials submitted from client
// hashes those credentials and sends an email
// to the email address submitted by the client
// Apply validation before request reaches the model
router.post("/register", userRegisterValidator, runValidation, register);

// Register activation route

// Takes hashed user credentials submitted from client
// decodes them, creates a new user and saves that
// use in the database
router.post("/register/activate", registerActivate);

// 
router.post("/Login", userLoginValidator, runValidation, login);

// In node any file created is
// treated as a module
module.exports = router;
