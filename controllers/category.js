const Category = require("../models/category");
// Helps in slugifying any string
const slugify = require("slugify");
const formidable = require("formidable");
// For generating unique keys for images
// to be stored in the database
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
// For reading the file synchronously
const fs = require("fs");

// Set up S3 using the same config
// object used in controllers/auth
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.create = (req, res) => {
  // Retrieve form data
  let form = new formidable.IncomingForm();
  // Form data will be coming in on req
  // but since this data is not in JSON
  // we user formidable to parse the request
  // Parse data to retrieve the fields
  // Title and content will be available as fields
  // Image will be availble as files
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not upload",
      });
    }
    // console.table({data, err, fields, files});
    const { name, content } = fields;
    console.log("Name and Content ===>",name, content)
    const { image } = files;
    // Generate a unique slug
    console.log("files ========>",files)
    console.log("Image ========>",image)
    const slug = slugify(name);

    let category = new Category({ name, content, slug });

    if (image.size > 2000000) {
      return res.status(400).json({
        error: "Image should be less thna 2mb",
      });
    }
    // Upload image to s3 and add the url to category

    // Create params
    const params = {
      Bucket: "ratetheweb",
      Key: `category/${uuidv4()}`,
      // Wrap image.path with readFileSync
      // so that the entire image path is available
      // (entire file is read from start to finish)
      // by the time the image is uploaded
      Body: fs.readFileSync(image.path),
      ACL: "public-read",
      ContentType: "image/jpg",
    };
    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.status(400).json({ error: "Upload to s3 failed" });
      }
      console.log("AWS upload response data", data);
      category.image.url = data.Location;
      category.image.key = data.key;

      // Save to database
      category.save((err, success) => {
        if (err) {
          console.log(err);
          res.status(400).json({ error: "Duplicate category detected" });
        }
        return res.json(success);
      });
    });
  });
};

// Create controller prior to using formidable

// exports.create = (req, res) => {
//   const {name, content} = req.body;
//   const slug = slugify(name);
//   // Save image url
//   // Hardcoded image for now
//   const image = {
//     url: `https://via.placeholder.com/200x150.png?text=${process.env.CLIENT_URL}`,
//     key: "142",
//   };

//   const category = new Category({ name, slug, image });

//   // User logged-in user's id as postedBy
//   // id is available on req.user via
//   // requireSignin (an express Jwt middleware)
//   // Refer to controllers/auth
//   category.postedBy = req.user._id;

//   category.save((err, data) => {
//     if(err) {
//       // error: err will be an object.
//       // We are sending the error string
//       // in this application to client and
//       // not an error object
//       console.log("Category create error", err);
//       return res.status(400).json({
//         error: "Category create failed"
//       })
//     }
//     res.json(data);
//   })

// }
exports.list = (req, res) => {
  //
};
exports.read = (req, res) => {
  //
};
exports.update = (req, res) => {
  //
};
exports.remove = (req, res) => {
  //
};
