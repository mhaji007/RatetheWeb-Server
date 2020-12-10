const User = require("../models/user");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const {registerEmailParams} = require("../helpers/email");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists in database
  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        err: "Email is taken",
      });
    }
    // Generate token with username, email and password.
    // This information will be hashesd using jwt token
    // and sent back to user's email as a clickable link
    // and when clicked the user is redirected to the frontend
    // on frontend this token is taken from the url and sent
    // back to the server, therefore ensuring a user with a
    // valid email is saved in the database

    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: "10m",
      }
    );

    // initialize register email params
    const params =  registerEmailParams( email, token);

    // Send email containing the token (hashed name, email, and password)
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("email submitted to SES", data);
        res.json({
          message: `Email has been sent to ${email}. Follow the instructions to complete your registration.`
        })
      })
      .catch((error) => {
        console.log("ses email on register", error);
        res.json({
          error: "We could not verify your email. Please try again."
        })
      });
  });
};
