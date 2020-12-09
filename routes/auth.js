// House all authentication routes


const express = require("express");
const router = express.Router();


router.get("/register", (req, res) => {
  res.json({
    data: "RatetheWeb register endpoint",
  });
});

// In node any file created is
// treated as a module

module.exports = router;
