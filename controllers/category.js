const Category = require("../models/category");
const Link = require("../models/link");
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
  // image is uploaded from client and converted to binary data client-side
  // we need to create a new base-64 data using buffer since
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

    // Save logged-in user's id as postedBy
    // user._id is made available on req via
    //requireSignin auth middleware
    category.postedBy = req.user._id;

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

// Retrieve a single category
// and related links
exports.read = (req, res) => {
  // Query parameter is available on req.params.slug
  const { slug } = req.params;

  // If limit was not sent in by client use 10
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;

  // If skip was not sent in by client use 0
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  Category.findOne({ slug })
    // Populate postedBy and grab id,
    // name and username out of user
    .populate("postedBy", "_id name username")
    .exec((err, category) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          error: "Category could not load",
        });
      }
      // The following only returns
      // a single category data (name, content, image
      // that is used to display at the top).
      // but the page needs to display all the related
      // links associated with the selected category as well

      // res.json(category);

      // Find the links based on the categories array
      Link.find({ categories: category })
        .populate("postedBy", "_id name username")
        .populate("categories", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec((err, links) => {
          if (err) {
            console.log(err)
            return res.status(400).json({
              error: "Could not load associated links"
            })
          }
          res.json({category, links})
        })
    });
};



exports.update = (req, res) => {
  const { slug } = req.params;
  // destructure nam, content and image from body sent by client
  // Note: admin might or might not provide a new image (i.e. update category
  // with or without a new image)
  const { name, image, content } = req.body;

  // Image data
  // image is uploaded from client and converted to binary data client-side
  // we need to create a new base-64 data using buffer since
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

  // Find category based on slug and category name and content
  Category.findOneAndUpdate({ slug }, { name, content }, { new: true }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: "Could not find category to update",
        });
      }
      console.log("Updated", updated);
      // Check whether image is supplied
      //(i.i., there is a value for image destructred from body)
      if (image) {
        // Remove the existing image from s3 before uploading new/updated one
        const deleteParams = {
          Bucket: "ratetheweb",
          Key: `${updated.image.key}`,
        };

        s3.deleteObject(deleteParams, function (err, data) {
          if (err) console.log("S3 delete error during update", err);
          else console.log("S3 deleted during update", data);
        });

        // Handle upload image
        const params = {
          Bucket: "ratetheweb",
          Key: `category/${uuidv4()}.${type}`,
          Body: base64Data,
          ACL: "public-read",
          ContentEncoding: "base64",
          ContentType: `image/${type}`,
        };

        s3.upload(params, (err, data) => {
          if (err) {
            console.log(err);
            res.status(400).json({ error: "Upload to s3 failed" });
          }
          console.log("AWS upload res data", data);
          updated.image.url = data.Location;
          updated.image.key = data.Key;

          // Save to db
          updated.save((err, success) => {
            if (err) {
              console.log(err);
              res.status(400).json({ error: "Duplicate category" });
            }
            res.json(success);
          });
        });
        // If there were no image provided
        // (i.e., admin is just updating name and content)
      } else {
        res.json(updated);
      }
    }
  );
};

exports.remove = (req, res) => {
  const {slug} = req.params;

  Category.findOneAndRemove({slug}).exec((err, data) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "Could not delete category",
      });
    }
    // Remove the existing image from s3 before uploading new/updated one
    // Remove the category but keep the key while deleting
    const deleteParams = {
      Bucket: "ratetheweb",
      Key: `${data.image.key}`,
    };

    s3.deleteObject(deleteParams, function (err, data) {
      if (err) console.log("S3 delete error", err);
      else console.log("S3 deleted", data);
    });
    res.json({
      message: `Category was successfully deleted`
    })
  })
};
