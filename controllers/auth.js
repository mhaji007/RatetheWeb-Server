const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  // What must be send in email
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
          Data: `<html><body><h1> Hello ${name}</h1><p style={"color: blue;"}>Test email</p></body></html>`,
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
};
