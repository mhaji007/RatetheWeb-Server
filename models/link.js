const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schma;

const linkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: "Title is required",
      // required: true,
      max: [12, "Title cannot exceed 256 characters"],
    },

    url: {
      type: String,
      trim: true,
      required: "Url is required",
      max: [256, "Url cannot exceed 256 characters"],
    },

    // Not required
    // a single link view
    // is not created/displayed
    // when users click on links
    slug: {
      type: String,
      lowercase: true,
      required: true,
      index: true,
    },
    // Associate each user
    // with a link (who submitted the link)
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    // Associate each link to categories
    // each link may fall into several
    // categories 
    categories: [
      {
        type: ObjectId,
        ref: "Category",
        // User has to pick
        // at least one category
        required: true,
      },
    ],
    // Type of resource associated
    // with each link
    type: {
      type: String,
      default: "Free",
    },
    // Medium associate with
    // each link
    medium: {
      type: String,
      default: "Video",
    },
    // Click counts
    clicks: {
      type: Number,
      defaul: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
