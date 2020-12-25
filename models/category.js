const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Name is required",
      max: [32, "Name cannot exceed 32 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },
    // Image is saved in AWS and
    // the URL of the uploaded image
    // is saved in the database
    // AWS S3 (Simple Storage Service) gives us a url
    // key can be used to delete
    // a given image
    image: {
      url: String,
      key: String,
    },
    content: {
      // type: {} can store any type.
      // Disadvatnage of {} is we cannot
      // enforce required or unique and we
      // have to implement our own check
      type: {},
      min: [20, "Content cannot be less than 20 characters"],
      max: [2000000, "Content cannot exceed 2MB"],
    },
    // logged in user's id is saved
    // as a postedBy
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
