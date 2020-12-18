// File containing an array of checks
// ran on user input
// used by auth route in routes

const { check } = require("express-validator");

// Array of fields to be checked
exports.userRegisterValidator = [
  check("name")
    // Make sure it is not empty
    .not()
    .isEmpty()
    .withMessage("Name is required"),
  check("email")
    // Make sure it is not invalid
    .isEmail()
    .withMessage("Email is not valid"),
  // Make sure it is not short
  check("password")
    .isLength({ name: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

exports.userLoginValidator = [
  check("email")
    // Make sure it is not invalid
    .isEmail()
    .withMessage("Email is not valid"),
  // Make sure it is not short
  check("password")
    .isLength({ name: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

exports.forgotPasswordValidator = [
  check("email")
    // Make sure it is not invalid
    .isEmail()
    .withMessage("Email is not valid"),
  // Make sure it is not short
];

exports.resetPasswordValidator = [
  check("newPassword")
    .isLength({ name: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("resetPasswordLink").not().isEmpty().withMessage("Token is required"),
];
