const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: "Username is required",
      // required: true,
      max: [12, "Username cannot exceed 32 characters"],
      // max: 12,
      unique: true,
      // for performance benefit
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      required: "Name is required",
      max: [32, "Name cannot exceed 32 characters"],
    },
    email: {
      type: String,
      trim: true,
      required: "Email is required",
      unique: true,
      lowercase: true,
    },
    // Frontend sends the unhashed password
    // plain password is then hashed and saved
    // in the backend
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    role: {
      type: String,
      default: "subscriber",
    },
    resetPasswordLink: {
      data: String,
      default: "",
    },
  },
  { timestamps: true }
);


// Virtual fields ==> "password", used to get the plain password
// and save the hashed password. It has a middleware role

// password from client side
// is passed to virtual
userSchema
  .virtual('password')
  .set(function (password) {
    // create temp varaible called _password
    this._password = password;
    // generate salt
    // this.salt refers to salt in schema
    this.salt = this.makeSalt();
    //encrypt password
    // this.hashed_password is hassed-password in schema
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// Methods ==>
// each user schema may be assigned methods
// 1) authenticate compares and checks the incoming password
// and the hashed version
// 2) encryptPassword  which will hash the password
// 3) makeSalt
// export user schema

userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) == this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

module.exports = mongoose.model("User", userSchema);
