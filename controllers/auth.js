const User = require("../models/user");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const { registerEmailParams } = require("../helpers/email");
const shortId = require("shortid");

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
        err: "Email is taken. Please choose another email.",
      });
    }
    // Generate registration token with username, email and password.
    // Use JWT_ACCOUNT_ACTIVATION as the key
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

    // Initialize register email params
    const params = registerEmailParams(email, token);

    // Send email containing the token (hashed name, email, and password)
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("Email submitted to SES", data);
        res.json({
          message: `Email has been sent to ${email}. Follow the instructions to complete your registration.`,
        });
      })
      // Without adding status(422) error is not displaying on client
      .catch((error) => {
        console.log("ses email on register", error);
        res.status(422).json({
          error: "We could not verify your email. Please try again.",
        });
      });
  });
};

exports.registerActivate = async (req, res) => {
  const { token } = req.body;
  // console.log(token);
  // Verify token against secret to check for expiration
  jwt.verify(
    token,
    process.env.JWT_ACCOUNT_ACTIVATION,
    function (err, decoded) {
      if (err) {
        return res.status(401).json({
          error: "Expired link. Please try again",
        });
      }

      // Decode name, email and password from token
      const { name, email, password } = jwt.decode(token);

      // Generate a unique username
      const username = shortId.generate();

      // Check for duplicate users
      User.findOne({ email }).exec((err, user) => {
        if (user) {
          // 401 ==> Unauthorized
          return res.status(401).json({
            error: "Email is taken. Please choose another email.",
          });
        }
        // Create new user
        const newUser = new User({ username, name, email, password });
        newUser.save((err, result) => {
          if (err) {
            return res.status(401).json({
              error: "Error saving user in database. Please try again later.",
            });
          }
          return res.json({
            message: "Registration was successful. Please proceed to login.",
          });
        });
      });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  //  console.table({ email, password });
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error:
          "No user matching this email was found in the database. Please register and try again.",
      });
    }
    // Authenticate password using the authenticate model
    // defined on user model
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and password do not match",
      });
    }
    // Generate login token with user._id (instead of username, email, and password
    // as it was the case with registration token)
    // Use JWT_SECRET instead of JWT_ACCOUNT_ACTIVATION as secret.
    // This token is used as an access token (e.g., later on there might be
    // a need for defining other endpoints such as post-create and access to such
    // endpoints should only be given to logged-in users)
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Destructure id, name, email and password from verified user
    const { _id, name, email, role } = user;
    // Send back token and destructured fields to client
    // This information is send back to client to be saved
    // in local storage or cookie
    return res.json({
      token,
      user: { _id, name, email, role},
    });
  });
};
