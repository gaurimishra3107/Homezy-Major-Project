const express = require("express");
const router = express.Router({mergeParams : true});
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, validateReview, isReviewAuthor} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");


//reviews
//POST Review Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

//Delete Post Route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor,  wrapAsync(reviewController.destroyReview));

module.exports = router;