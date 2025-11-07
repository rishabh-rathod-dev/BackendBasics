// import mongoose from "mongoose";
// import { DB_NAME } from "./constant";
// require('dotenv').config({path: './.env'});
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
 
dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
})
.catch((error) => {
    console.log("Error in DB connection!!!!", error);
})

/* Setup Express Server
import express from express;
const app = express();

(async () => {
    try{
       await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.error("Error in DB Connection", error);
            throw error;
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

    }catch(error) {
        console.error("Error in DB Connection", error);
        throw error;
    }
})(); 
*/