const Category = require("../models/category")
// Helps in slugifying any string
const slugify = require("slugify")

exports.create = (req, res) => {
  const {name, content} = req.body;
  const slug = slugify(name);
  // Save image url
  // Hardcoded image for now
  const image = {
    url: `https://via.placeholder.com/200x150.png?text=${process.env.CLIENT_URL}`,
    key: "142",
  };

  const category = new Category({ name, slug, image });


  // User logged-in user's id as postedBy
  // id is available on req.user via
  // requireSignin (an express Jwt middleware)
  // Refer to controllers/auth
  category.postedBy = req.user._id;

  category.save((err, data) => {
    if(err) {
      // error: err will be an object.
      // We are sending the error string
      // in this application to client and
      // not an error object
      console.log("Category create error", err);
      return res.status(400).json({
        error: "Category create failed"
      })
    }
    res.json(data);
  })

}
exports.list = (req, res) => {
//
}
exports.read = (req, res) => {
//
}
exports.update = (req, res) => {
//
}
exports.remove = (req, res) => {
//
}


