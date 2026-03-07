const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const { category, q } = req.query;
    let filter = {};

    if (category) {
        filter.category = category;
    } else if (q) {
        filter = {
            $or: [
                { title: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } },
                { country: { $regex: q, $options: "i" } },
            ]
        };
    }

    let listings = await Listing.find(filter);

    if (listings.length === 0 && (q || category)) {
        req.flash("error", "No listings match your search/filter.");
        return res.redirect("/listings");
    }

    res.render("listings/index.ejs", { listings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    };
    res.render("listings/show.ejs", { listing, mapToken });
};

module.exports.createListing = async (req, res, next) => {
    console.log(req.body);
    let response = await geocodingClient.forwardGeocode({
        query: req.body.location,
        limit: 1,
    })
    .send();

    if (Object.keys(req.body).length === 0) {
        throw new ExpressError(400, "Send valid data for listing");
    }

    let url = req.file.path;
    let filename = req.file.filename;

    let { title, description, image, price, location, country, category } = req.body;
    // if (!image || image.trim() === "") {
    //   image = undefined;
    // }
    let newListing = new Listing({
        title,
        description,
        image,
        price,
        location,
        country,
        category
    });
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    // newListing.category = req.body.category;

    if (!response.body.features.length) {
    req.flash("error", "Invalid location");
    return res.redirect("/listings/new");
    }

    newListing.geometry = response.body.features[0].geometry;
    console.log(newListing.geometry);

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let { title, description, image, price, location, country } = req.body;

    let updatedListing = await Listing.findByIdAndUpdate(id, {
        title: title,
        description: description,
        image: image,
        price: price,
        location: location,
        country: country
    }, { runValidators: true, new: true });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        updatedListing.image = { url, filename };
        await updatedListing.save();
    };

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};