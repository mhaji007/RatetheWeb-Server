// File for housing all authentication routes

const express = require("express");
const router = express.Router();

// Import middlewares
const {register} = require("../controllers/auth");


router.get("/register", register);

// In node any file created is
// treated as a module
module.exports = router;
