// exports.read = (req, res) => {
//   // req.profile.hashed_password = undefined;
//   // req.profile.salt = undefined;

//   return res.json(req.profile);
// };

const User = require("../models/user");
const Link = require("../models/link");
// ._id is made available on req through requireSign in
// controllers/auth
exports.read = (req, res) => {
  User.findOne({ _id: req.user._id }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    // Find all the links created by this user
    // userId is saved in postedBy upon creation
    // (refer to controllers/link)
    Link.find({ postedBy: user })
      .populate("categories", "name slug")
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .exec((err, links) => {
        if (err) {
          return res.status(400).json({
            error: "Could not find links",
          });
        }
        // Do not return hashed password and
        // salt to client
        user.hashed_password = undefined;
        user.salt = undefined;
        res.json({ user, links });
      });
  });
};

exports.update = (req, res) => {
  const { name, password, categories } = req.body;
  switch (true) {
    case password && password.length < 6:
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
      break;
  }
  User.findOneAndUpdate(
    { _id: req.user._id },
    { name, password, categories },
    { new: true }
  ).exec((err, updated) => {
    if (err) {
      return res.status(400).json({
        error: "Could not find user to update",
      });
    }
    updated.hashed_password = undefined;
    updated.salt = undefined;
    res.json(updated);
  });
};
