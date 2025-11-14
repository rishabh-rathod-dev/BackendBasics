import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";

const generateAccessandRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken, refreshToken };

    }
     catch(error){
        throw new APIError("Token generation failed", 500);
    }
}

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
    // if( fullName && userName && email && password ){
    //     throw new APIError("User registered successfully", 201);
    // }

    if([fullName, userName, email, password].some(field => field?.trim() === "")){
        throw new APIError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(existedUser){
        throw new APIError(409, "User already exists with this userName or email");
    }
    // console.log("Files", req.files);
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new APIError(400, "Avatar is required");
    }
    const avatar = await uploadToCloudinary(avatarLocalPath, "avatar");
    let coverImage;
    if(coverImageLocalPath)
    coverImage = await uploadToCloudinary(coverImageLocalPath, "coverImages");

    if(!avatar){
        throw new APIError(400, "Avatar file is required");
    }

    const user = await  User.create({
        userName: userName.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        fullName,
        email,
        password,
    })   
    
    const createdUser  = await User.findById(user._id).select('-password -refreshTokens');

    if(!createdUser){
        throw new APIError(500, "User creation failed");
    } 

    res.status(201).json(
        new APIResponse(201, createdUser, "User registered successfully")
    )
})

// const loginUser = asyncHandler(async (req, res) => {
    // Get email and password from frontend 
    // login via userName or email both
    // find the user in database
    // validate email and password 
    // generate access and refresh token
    // send cookies and response

//     const { email, userName, password } = req.body;

//     if(!(email || userName)){
//         throw new APIError(400, "Email or UserName is required to login"); 
//     }

//     const user = await User.findOne({
//         $or: [{email}, {userName}]
//     });

//     if(!user){
//         throw new APIError(404, "User not found with this email or userName");
//     }
     
//     const isPasswordCorrect = await user.isPasswordCorrect(password);
//     // console.log("Is Password Correct:", isPasswordCorrect);
//     if(!isPasswordCorrect){
//         console.log("Is Password Correct: if field", isPasswordCorrect);
//         throw new APIError(401, "Invalid password");
//     }

//     const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)
//     const loggedInUser = await User.findById(user._id).select('-password -refreshTokens');

//     const options = {
//         httpOnly: true,
//         secure: true
//     }
//     console.log("Login User:", loggedInUser);
//     return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
//         new APIResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
//     ) 
// })

const loginUser = asyncHandler(async (req, res) => {
    // Get email and password from frontend 
    // login via userName or email both
    // find the user in database
    // validate email and password 
    // generate access and refresh token
    // send cookies and response
    let { email, userName, password } = req.body;

    if (!(email || userName)) {
        throw new APIError(400, "Email or UserName is required to login");
    }

    // Normalize inputs
    if (email) email = email.toLowerCase().trim();
    if (userName) userName = userName.toLowerCase().trim();

    const user = await User.findOne({
        $or: [{ email }, { userName }]
    });

    if (!user) {
        throw new APIError(404, "User not found with this email or userName");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new APIError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new APIResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    })

const options = {
    httpOnly: true,
    secure: true,
}

return res.status(200).clearCookie('accessToken', options).clearCookie('refreshToken', options).json(new APIResponse(200, null, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new APIError(401, "Unauthorized access - Refresh token is required");
    }

    try {
        const decodedToken  = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new APIError(401, "Invalid refresh token - User not found");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new APIError(401, "Refresh Token is expired or used");
        }
    
        const options = {
            httpOnly: true,
            secure: true,
        };
    
        const {newRefreshToken, accessToken} = await generateAccessandRefreshToken(user._id);
        return res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', newRefreshToken, options).json(
            new APIResponse(200, { accessToken,refreshToken:newRefreshToken }, "Access token refreshed successfully")
        )
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid refresh token");
    }

});

export { registerUser, loginUser, logoutUser, refreshAccessToken }; 