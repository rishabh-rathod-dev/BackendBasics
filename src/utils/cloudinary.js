import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,  
});

const uploadToCloudinary = async (localFilePath, folder, resourceType="auto") => {
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', 
        })
        // file uploaded to cloudinary, now we can remove from local storage
        console.log("File uploaded to Cloudinary, now removing from local storage", response.url);
        return response;
    }
    catch (error) {
        fs.unlinkSync(localFilePath); // remove the file from local storage
        return null;
    }
}

export {uploadToCloudinary};