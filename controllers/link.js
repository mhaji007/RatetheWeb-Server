const Link = require("../models/link");
const User = require("../models/user");
const Category = require("../models/category");
const AWS = require("aws-sdk");
const slugify = require("slugify");
const { linkPublishedParams } = require("../helpers/email");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create a new instance of SES with specified config from SES docs
const ses = new AWS.SES({ apiVersion: "2010-12-01" });


// Endpoint for creating a link
exports.create = (req, res) => {
  const { title, url, categories, type, medium } = req.body;
  // console.table({ title, url, categories, type, medium });
  // No need to slugify the link
  // as the links submitted by the user
  // are already in valid format
  const slug = url;
  let link = new Link({ title, url, categories, type, medium, slug });
  // Assign the user who created the link
  link.postedBy = req.user._id;

  // Already sending comma separated
  // array of ids therefore the following
  // commented lines is not necessary

  // // Retrieve all categories (required if using Postman)
  // let arrayOfCategories = categories && categories.split(",");
  // link.categories = arrayOfCategories;
  // Save link to database

  link.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Link already exists",
      });
    }
    res.json(data);

    // Find all users in the category
    // (all users whose favorite category is same as the created link's category)
    // look through the array of categories for user if those categories are
    // included in the category array of link created, return those users
    User.find({ categories: { $in: categories } }).exec((err, users) => {
      console.log(users);
      if (err) {
        console.log("Error finding users to send email on link publish");
        throw new Error(err);
      }
      Category.find({ _id: { $in: categories } }).exec((err, result) => {
        // data is the created link
        // we need to send back not only data
        // bu also the category in which this link is published
        // therefore we add the result(the category) as a property
        // on data
        data.categories = result;

        for (let i = 0; i < users.length; i++) {
          const params = linkPublishedParams(users[i].email, data);
          const sendEmail = ses.sendEmail(params).promise();

          sendEmail
            .then((success) => {
              console.log("email submitted to SES ", success);
              return;
            })
            .catch((failure) => {
              console.log("error on email submitted to SES  ", failure);
              return;
            });
        }
      });
    });
  });
};
// Endpoint for retrieving all the links
exports.list = (req, res) => {
  // If limit was not sent in by client use 10
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;

  // If skip was not sent in by client use 0
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  Link.find({})
    .populate("postedBy", "name")
    .populate("categories", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Could not list links",
        });
      }
      res.json(data);
    });
};

exports.read = (req, res) => {
  const { id } = req.params;

  Link.findOne({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Error finding link",
      });
    }
    res.json(data);
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { title, url, categories, type, medium } = req.body;

  const updatedLink = { title, url, categories, type, medium };

  Link.findOneAndUpdate({ _id: id }, updatedLink, { new: true }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: "Error updating the link",
        });
      }
      res.json(updated);
    }
  );
};

exports.remove = (req, res) => {
  const { id } = req.params;
  Link.findOneAndRemove({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Error removing the link",
      });
    }
    res.json({
      message: "Link has been removed successfully",
    });
  });
};

// Endpoint for handling click count
exports.clickCount = (req, res) => {
  // Retrieve link Id (slug) from client
  const { linkId } = req.body;
  // Find the link with the id retrieved and increment the click count by one
  // and return the new link object back to client
  Link.findByIdAndUpdate(linkId, { $inc: { clicks: 1 } }, { new: true }).exec(
    (err, result) => {
      if (err) {
        return res.status(400).json({
          error: "Could not view count",
        });
      }
      // Sometime return is used and sometimes not
      // when return keyword is encountered the code after is not executed
      // When returning json response return keyword is not required
      res.json(result);
    }
  );
};
