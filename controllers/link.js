const Link = require("../models/link");
const slugify = require("slugify");

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
  });
};
// Endpoint for retrieving all the links
exports.list = (req, res) => {
  Link.find({}).exec((err, data) => {
    if (err) {
      res.status(400).json({
        error: "Links were not found",
      });
    }
    res.json(data);
  });
};

exports.read = (req, res) => {};

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
