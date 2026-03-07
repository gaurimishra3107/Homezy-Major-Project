const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
require('dotenv').config({ path: '../.env' });

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const dbUrl = process.env.ATLASDB_URL;

// 1. Database Connection Logic
async function main() {
    await mongoose.connect(dbUrl);
}

// 2. Data Initialization Logic
const initDB = async () => {
    await Listing.deleteMany({});
    console.log("Old data cleared. Geocoding new data...");

    const enrichedData = await Promise.all(initData.data.map(async (obj) => {
        const response = await geocodingClient.forwardGeocode({
            query: obj.location,
            limit: 1,
        }).send();

        return {
            ...obj,
            owner: "69a6d2338f5bee8aa77c0696",
            geometry: response.body.features.length > 0 
                ? response.body.features[0].geometry 
                : { type: "Point", coordinates: [0, 0] }
        };
    }));

    await Listing.insertMany(enrichedData);
    console.log("Data was initialized successfully!");
};

// 3. Execution: ONLY run initDB after main() succeeds
main()
    .then(() => {
        console.log("Connected to DB");
        return initDB(); // Now it waits for connection
    })
    .then(() => {
        mongoose.connection.close(); // Optional: closes the script automatically
    })
    .catch((err) => {
        console.log("Error:", err);
    });