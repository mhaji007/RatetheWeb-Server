const { check } = require("express-validator");

// Array of fields to be checked
exports.linkCreateValidator = [
  check("title")
    .not()
    .isEmpty()
    .withMessage("Title is required"),
  check("url")
    .not()
    .isEmpty()
    .withMessage("URL is required"),
  check("categories")
    .not()
    .isEmpty()
    .withMessage("Category is required. Please pick a category."),
  check("type")
    .not()
    .isEmpty()
    .withMessage("Type is required. Please pick a type (free/paid)."),
  check("medium")
    .not()
    .isEmpty()
    .withMessage("Medium is required. Please pick a medium (video/article)."),
];
exports.linkUpdateValidator = [
  check("title")
    .not()
    .isEmpty()
    .withMessage("Title is required"),
  check("url")
    .not()
    .isEmpty()
    .withMessage("URL is required"),
  check("categories")
    .not()
    .isEmpty()
    .withMessage("Category is required. Please pick a category."),
  check("type")
    .not()
    .isEmpty()
    .withMessage("Type is required. Please pick a type (free/paid)."),
  check("medium")
    .not()
    .isEmpty()
    .withMessage("Medium is required. Please pick a medium (video/article)."),
];
