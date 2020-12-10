// File containing an array of checks
// ran on user input
// used by index.js in validators

const {check} = require("express-validator");

exports.userRegisterValidator = [
  check('name')
  // Make sure it is not empty
  .not()
  .isEmpty()
  .withMessage("Name is required"),
  check('email')
  // Make sure it is noy invalid
  .not()
  .isEmail()
  .withMessage("Email is not valid"),
  // Makre sure it is not short
  check('password')
  .not()
  .isLength({name:6})
  .withMessage("Password must be at least 6 characters long"),
]
