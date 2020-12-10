// Middleware responsible for running the validation
// used by auth route in routes

const {validationResult} = require("express-validator")

exports.runValidation = (req, res, next) => {
  // Intercept all (if any errors) thrown by checks
  // in auth.js in validator
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    // 422 ==> unprocessable entity
    return res.status(422).json({
      // Display the first error message
      error: errors.array()[0].msg
    })
  }
  next()
}
