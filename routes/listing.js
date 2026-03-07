const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js"); 
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

//index route and create route
router.route("/").get(wrapAsync(listingController.index))
.post(isLoggedIn, upload.single('image'), validateListing, wrapAsync(listingController.createListing));

//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//update route, show route, and delete route
router.route("/:id").put(isLoggedIn, isOwner, upload.single('image'), validateListing, wrapAsync(listingController.updateListing)).get(wrapAsync(listingController.showListing)).delete(isLoggedIn, wrapAsync(listingController.destroyListing));

//edit route
router.get("/:id/edit", isLoggedIn, isOwner, validateListing, wrapAsync(listingController.renderEditForm));

module.exports = router;