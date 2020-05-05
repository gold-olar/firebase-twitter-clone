const admin = require("firebase-admin");
const db = admin.firestore();
const firebase = require("firebase");
const path = require("path");
const os = require("os");
const fs = require("fs");
const BusBoy = require("busboy");
const BaseController = require("./base.ctrl");

class UserController extends BaseController {
  constructor() {
    super();
  }



  async register(req, res) {
    const { username, email, password } = req.body;
  
    try {
      let token;
      let userId;
      const existingUser = await db.doc(`/users/${username}`).get();
      const defaultImage = 'social.png';
      if (existingUser.exists) {
        return super.sendError(
          res,
          null,
          "A user with this username exists.",
          400
        );
      } else {
        const registeredUser = await firebase
          .auth()
          .createUserWithEmailAndPassword(email, password);
        if (registeredUser) {
          userId = registeredUser.user.uid;
          token = await registeredUser.user.getIdToken();
          const userCredentials = {
            username,
            email,
            userId,
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${defaultImage}?alt=media`,
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          };
          const savedUser = await db
            .doc(`/users/${username}`)
            .set(userCredentials);
          if (savedUser) {
            return super.sendSuccess(
              res,
              { token },
              `${username}, your registeration was successfull.`,
              201
            );
          }
        }
      }

      return super.sendError(res, null, "Could not register, try again", 400);
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }
  


  async login(req, res) {
      
    try {
      const { email, password } = req.body;
      let token;
      const loginUser = await firebase.auth().signInWithEmailAndPassword(email, password);

      
      if (loginUser) {
        token = await loginUser.user.getIdToken();
        return super.sendSuccess(res, { token }, "Welcome back.", 200);
      }
      return super.sendError(
        res,
        null,
        "There was an issue, Please try again",
        400
      );
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        return super.sendError(res, null, "Wrong password", 403);
      }
      return super.sendError(res, err, err.message, 500);
    }
  }



  async uploadImage(req, res) {
    try {
      const { headers, user } = req;
      const busboy = new BusBoy({ headers });
      let imageFileName;
      let imageToBeUploaded;

      busboy.on("file", (fieldName, file, fileName, encoding, mimetype) => {
           if(mimetype !== 'image/png' || mimetype !== 'image/jpe' || mimetype !== 'image/jpeg'){
            return super.sendError(res, null, 'Invalid image type', 400);
        }
        const imageNameArray = fileName.split(".");
        const imageExtension = imageNameArray[imageNameArray.length - 1];
        imageFileName = `${Math.round(
          Math.random() * 10000000000
        )}.${imageExtension}`;

        const filePath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = {
          filePath,
          mimetype,
        };

        return file.pipe(fs.createWriteStream(filePath));
      });

      busboy.on("finish", async () => {
       
        const uploadedToBucket = await admin
          .storage()
          .bucket()
          .upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
              metadata: {
                contentType: imageToBeUploaded.mimetype,
              },
            },
          });
        if (uploadedToBucket) {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${imageFileName}?alt=media`;
          const addedUserImage = await db
            .doc(`/users/${user.username}`)
            .update({
              imageUrl,
            });
          if (addedUserImage) {
            return super.sendSuccess(
              res,
              { imageUrl },
              "Image uploaded successfully",
              200
            );
          }
        }
        return super.sendError(res, null, "Image could not be uploaded.", 400);
      });
      return busboy.end(req.rawBody);
    //   return console.log(req.body); 
    } catch (err) {
        return super.sendError(res, err, err.message, 500);
    }
  }
}

module.exports = new UserController();
