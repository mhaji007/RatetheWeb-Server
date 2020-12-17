// Refactored from auth controllers
// helper function used in auth.js in controllers to intitialize email parameters

// What must be sent in email
// return oblect is formed based on Amazon ses specs
exports.registerEmailParams = (email, token) => {
  return {
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
              <h1>
              Verify your email to continue
              </h1>
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
};
