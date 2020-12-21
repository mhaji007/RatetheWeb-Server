const { check } = require("express-validator");

// Array of fields to be checked
exports.categoryCreateValidator = [
  check("name")
    // Make sure it is not empty
    .not()
    .isEmpty()
    .withMessage("Name is required"),
  check("image")
    // Make sure it is not empty
    .not()
    .isEmpty()
    .withMessage("Image is required"),
  // Make sure it is not short
  check("content")
    .isLength({ min: 20 })
    .withMessage("Content of minimum 20 characters is required"),
];

exports.categoryUpdateValidator = [
  check("name")
    // Make sure it is not empty
    .not()
    .isEmpty()
    .withMessage("Name is required"),
  // Make sure it is not short
  check("content")
    .isLength({ min: 20 })
    .withMessage("Content of minimum 20 characters is required"),
];
