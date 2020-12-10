const User = require("../models/user");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");

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

    // Send email containing the token (hashed name, email, and password)

    // What must be sent in email
    const params = {
      // Where email is generated from (e.g., admin@yourdomain.com)
      Source: process.env.EMAIL_FROM,
      // Where email is sent to (an array of addresses)
      Destination: {
        ToAddresses: [email],
      },
      // Where recepients reply is going to
      ReplyToAddresses: [process.env.EMAIL_TO],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
            <html>
              <h1> Hello ${name},
              Verify your email to continue</h1>
             <p >Please use the following link to complete your registration:</p>
             <p> ${process.env.CLIENT_URL}/auth/activate/${token}</p>
            </html>
            `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Complete Your Registration",
        },
      },
    };
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("email submitted to SES", data);
        res.send("Email sent");
      })
      .catch((error) => {
        console.log("ses email on register", error);
        res.send("Email failed");
      });
  });
};
