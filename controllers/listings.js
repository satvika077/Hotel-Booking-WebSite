const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        }).populate("owner");
    if (!listing) {
        req.flash("error", "listing you requested for, does not exist");
        return res.redirect("/listings");
    }
    
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  try {
    // Get form data
    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // Get coordinates from form (latitude and longitude)
    const latitude = parseFloat(req.body.listing.latitude);
    const longitude = parseFloat(req.body.listing.longitude);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      req.flash("error", "Please provide valid latitude and longitude");
      return res.redirect("/listings/new");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      req.flash("error", "Invalid coordinates. Latitude must be -90 to 90, Longitude must be -180 to 180");
      return res.redirect("/listings/new");
    }

    // Store geometry in GeoJSON format for Leaflet
    newListing.geometry = {
      type: "Point",
      coordinates: [longitude, latitude]
    };

    let savedlisting = await newListing.save();
    console.log("New listing created:", savedlisting.title);

    req.flash("success", "new listing created!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Error creating listing:", err.message);
    req.flash("error", "Error creating listing. Please try again.");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "listing does not exist");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    // Update coordinates if provided
    const latitude = parseFloat(req.body.listing.latitude);
    const longitude = parseFloat(req.body.listing.longitude);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      listing.geometry = {
        type: "Point",
        coordinates: [longitude, latitude]
      };
      await listing.save();
    }

    req.flash("success", "listing updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
        throw new ExpressError(404, "Listing not found");
    }
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};
