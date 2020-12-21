const Category = require("../models/category");
// Helps in slugifying any string
const slugify = require("slugify");
// For receiving and parsing form data
const formidable = require("formidable");
// For generating unique keys for images
// to be stored in the database
const { v4: uuidv4 } = require("uuid");
// For uploading images to S3
const AWS = require("aws-sdk");
// For reading the file synchronously
const fs = require("fs");

// Set up S3 using the same config
// object used in controllers/auth
// used for uploading the image
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Controller method for creating a category
// using JSON data (uploading base64 images to S3)
// binary data is sent from client to server

exports.create = (req, res) => {
  const { name, image, content } = req.body;

  // Image data
  // image is uploaded and converted to binary data
  // we need to create a new base-64 data using buffer
  // base-64 image format looks like the following:
  // data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACgAAAAaqCAYAAAACcyMkAAABS
  // We need to omit the data:image/png;base64, part
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  // Image type
  //(optional - previosuly using fromData image uploaded without type in params ==> Key: `category/${uuidv4()})
  // first split ==> ["data:image/png", "rest of the image format"]
  // second split ==> ["data:image", "png"]
  const type = image.split(";")[0].split("/")[1];

  // Generate a unique slug for name
  const slug = slugify(name);
  // Instantiate and new category
  let category = new Category({ name, content, slug });

  // Upload image to s3 and add the base-64 image to category
  // Create params (a template for sending images)
  const params = {
    // Which bucket to upload to
    Bucket: "ratetheweb",
    // category is an (optional) folder
    // created inside the bucket to have all
    // images inside a folder
    Key: `category/${uuidv4()}.${type}`,
    // The actual image sent in body
    // Wrap image.path with readFileSync
    // so that the entire image path is available
    // (entire file is read from start to finish)
    // by the time the image is uploaded
    Body: base64Data,
    // Access Control Level: set in bucket permissions
    // makes it possible for users to view the image
    // without including any special authorizations in headers
    ACL: "public-read",
    // required when sending base-64
    ContentEncoding: "base-64",
    // Type of image uploaded
    ContentType: `image/${type}`,
  };

  // Upload the image using a new instance of S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({ error: "Upload to s3 failed" });
    }
    console.log("AWS upload response data", data);
    // The url returned from s3 is available on Location
    // set url to image.url from database
    category.image.url = data.Location;
    // The image key returned from s3 is available on key
    // set key to image.key from database
    category.image.key = data.Key;

    // Save to database
    category.save((err, success) => {
      if (err) {
        console.log(err);
        res.status(400).json({ error: "Duplicate category detected" });
      }
      return res.json(success);
    });
  });
};

// ==================================================================== //
// Controller method for creating a category
// using formData

// exports.create = (req, res) => {
//   // Retrieve form data
//   let form = new formidable.IncomingForm();
//   // Form data will be coming in on req
//   // but since this data is not in JSON
//   // we use formidable to parse the request.
//   // It parses data to retrieve the fields.
//   // Title and content will be available as fields.
//   // Image will be availble as files
//   form.parse(req, (err, fields, files) => {
//     if (err) {
//       return res.status(400).json({
//         error: "Image could not upload",
//       });
//     }
//     // console.table({data, err, fields, files});
//     const { name, content } = fields;
//     // The naming here is important
//     // When sending from client
//     // the same name (image) should be used
//     const { image } = files;
//     // Generate a unique slug
//     const slug = slugify(name);
//     // Instantiate and new category
//     let category = new Category({ name, content, slug });
//     // Image validation
//     // (not necessary since image will
//     // later be resized client sized)
//     if (image.size > 2000000) {
//       return res.status(400).json({
//         error: "Image should be less thna 2mb",
//       });
//     }

// Upload image to s3 and add the url to category

// Create params (a template for sending images)
//     const params = {
//       // Which bucket to upload to
//       Bucket: "ratetheweb",
//       // category is an (optional) folder
//       // created inside the bucket to have all
//       // images inside a folder
//       Key: `category/${uuidv4()}`,
//       // The actual image sent in body
//       // Wrap image.path with readFileSync
//       // so that the entire image path is available
//       // (entire file is read from start to finish)
//       // by the time the image is uploaded
//       Body: fs.readFileSync(image.path),
//       // Access Control Level: set in bucket permissions
//       // makes it possible for users to view the image
//       // without including any special authorizations in headers
//       ACL: "public-read",
//       // Type of image uploaded
//       ContentType: "image/jpg",
//     };
// //     // Upload the image using a new instance of s3
//     s3.upload(params, (err, data) => {
//       if (err) {
//         console.log(err);
//         res.status(400).json({ error: "Upload to s3 failed" });
//       }
//       console.log("AWS upload response data", data);
//       // The url returned from s3 is available on Location
//       // set url to image.url from database
//       category.image.url = data.Location;
//       // The image key returned from s3 is available on key
//       // set key to image.key from database
//       category.image.key = data.Key;

//       // Save to database
//       category.save((err, success) => {
//         if (err) {
//           console.log(err);
//           res.status(400).json({ error: "Duplicate category detected" });
//         }
//         return res.json(success);
//       });
//     });
//   });
// };

// ==================================================================== //
// Create controller prior to using formidable
// using hardcoded image

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
// ==================================================================== //

// List all categories
exports.list = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Categories could not load",
      });
    }
    res.json(data);
  });
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
