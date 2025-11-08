import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    // Logic to register a user
    // We will take data from user (fullName, userName, email, password) from frontend
    // Validation will be done here
    // Check user is alreaady exists (userName, Email)
    // check for images or avatar
    // upload image to cloudinary (avatar is required, images is optional)
    // create user object - create entry in database
    // remove password and refreshToken from response
    // check for user creation success
    // return res

    const { userName, fullName, email, password } = req.body;
    console.log("Username",userName);

    // if( fullName && userName && email && password ){
    //     throw new APIError("User registered successfully", 201);
    // }

    if([fullName, userName, email, password].some(field => field?.trim() === "")){
        throw new APIError("All fields are required", 400);
    }

    const existedUser = User.findOne({
        $or: [{userName}, {email}]
    })

    if(existedUser){
        throw new APIError("User already exists with this userName or email", 409);
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new APIError("Avatar is required", 400);
    }
    const avatar = await uploadToCloudinary(avatarLocalPath, "avatar");
    const coverImage = await uploadToCloudinary(coverImageLocalPath, "coverImages");

    if(!avatar){
        throw new APIError("Avatar file is required", 400);
    }

    const user =  User.create({
        userName: userName.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        fullName,
        email,
        password,
    })   
    
    const cratedUser  = await user.findById(user._id).select('-password -refreshTokens -__v');

    if(!cratedUser){
        throw new APIError("User creation failed", 500);
    } 

    res.status(201).json(
        new APIResponse(201, cratedUser, "User registered successfully")
    )
})

export { registerUser } ;