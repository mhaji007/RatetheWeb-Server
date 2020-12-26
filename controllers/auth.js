// Auth specific controller methods and middlewares

const User = require("../models/user");
const Link = require("../models/link");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const {
  registerEmailParams,
  forgotPasswordParams,
} = require("../helpers/email");
const shortId = require("shortid");
const expressJwt = require("express-jwt");
const _ = require("lodash");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create a new stance of SES with specified config from docs
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// Controller method for sending registration email
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

    // Initialize register email params with email and token
    const params = registerEmailParams(email, token);

    // Send email containing the token (hashed name, email, and password)
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("Email submitted to SES", data);
        // Display success message to the user after email is sent
        res.json({
          message: `Email has been sent to ${email}. Follow the instructions to complete your registration.`,
        });
      })
      // Display error message to the user after email is sent
      // Without adding status(422) error is not displaying on client
      .catch((error) => {
        console.log("ses email on register", error);
        res.status(422).json({
          error: "We could not verify your email. Please try again.",
        });
      });
  });
};

// Controller method for activating the registered user's account
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

// Controller method for logging-in the user
// (verifying email and password, creating token and sending back user info)
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

    // Destructure id, name, email and role from verified user
    const { _id, name, email, role } = user;
    // Send back token and destructured fields to client
    // This information is send back to client to be saved
    // in local storage or cookie
    return res.json({
      token,
      user: { _id, name, email, role },
    });
  });
};

// ================ Auth middleware ================ //

// expressJWT middleware to check for valid token and
// make id of user available to role-based auth middlewares

// requireSignin
// Looks for valid token
// in the request headers
// if a valid token is found, it will check the token
// against the secret and if the same secret
// is used on signing the token, then it will check
// for expiry of the token and if that checks out
// it will make the decoded token (what was used in generating the json web token)
// available on req.user (e.g., here _id is used
// in genearating the token, hence req.user._id)
exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

// ================ Role-based auth middlewares ================ //

// Custom middleware to make logged-in user info available
// This middleware requires that requireSignin runs first
// so the ._id is available on req.user
exports.authMiddleWare = (req, res, next) => {
  const authUserId = req.user._id;
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      console.log(err);
      return res.status(400).json({
        error: "User not found",
      });
    }

    // Make currently logged-in user's
    // information available on a new
    // property on req named profile
    req.profile = user;
    next();
  });
};

// Custom middleware to make logged-in admin info available
// This middleware requires that requireSignin runs first
// so the ._id is available on req.user
exports.adminMiddleWare = (req, res, next) => {
  const authUserId = req.user._id;
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      console.log(err);
      return res.status(400).json({
        error: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(400).json({
        error: "Admin only resource. Access denied.",
      });
    }

    // Make currently logged-in admin's
    // information available on a new
    // property on req named profile
    req.profile = user;
    next();
  });
};

// ============================================================== //

// Controller method for sending forgot password email
exports.forgotPassword = (req, res) => {
  // Query data base to see whether user's email exist
  const { email } = req.body;
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "No user associated with this email found in the database",
      });
    }
    // If found generate a jsonweb token
    const token = jwt.sign(
      { name: user.name },
      process.env.JWT_RESET_PASSWORD,
      { expiresIn: "10m" }
    );
    // and send this token via email to the user.
    // Initialize register email params with email and token
    const params = forgotPasswordParams(email, token);
    // At the same time populate resetPasswordLink field with
    // the generated token  for that user in the database
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: "Password reset failed. Please try again later",
        });
      }
      const sendEmail = ses.sendEmail(params).promise();
      sendEmail
        .then((data) => {
          console.log("ses reset password success", data);
          return res.json({
            message: `Email has been sent to ${email}. Click on the link to reset your password`,
          });
        })
        .catch((error) => {
          console.log("ses reset passwprd failed", error);
          res.status(422).json({
            error: "We could not verify your email. Please try again later.",
          });
        });
    });
  });
};

// Controller method for resetting user's password
exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (resetPasswordLink) {
    // Check for token (resetPasswordLink) expiry
    // using the built-in jwt verify mehtod
    // By default this method checks both for a valid
    // token and the expiry of this token
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      (err, success) => {
        if (err) {
          return res.status(400).json({
            error: "This link has expired. Please try again",
          });
        }

        User.findOne({ resetPasswordLink }).exec((err, user) => {
          if (err || !user) {
            return res.status(400).json({
              error: "Invalid token. Please try again",
            });
          }

          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };
          // Extend the found user object with
          // the updateFields object using lodash's
          // extend method
          user = _.extend(user, updatedFields)

          // Save the updated user object
          // to database
          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: "Password reset failed. Please try again"
              })
            }
            res.json({
              message:"Your password has been updated. You may proceed to login with your new credentials"
            })
          })
        });
      }
    );
  }
};


// Custom middleware for controlling link update and delete functionalities of non-admin users
// Users that are not admin should only be able to update or delete their own links
// This middleware prevents a user to modify links posted by others (e.g., through postman, etc.)
exports.CanUpdateDeleteLink = (req, res, next) =>{
  // This middleware only runs when updating or deleting links
  // and by that time we have access to id on req
  const {id} =req.params;
  Link.findOne({_id:id}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Could not find link"
      })
    }
    let authorizedUser = data.postedBy._id.toString() === req.user._id.toString()

    if (!authorizedUser) {
      return res.status(401).json({
        error:"You are not authorize to access this resource"
      })
    }
    next();
  })
}
