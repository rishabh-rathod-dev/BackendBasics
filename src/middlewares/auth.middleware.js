import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    if (!token) {
        throw new APIError("Access token is missing", 401)
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id).select('-password -refreshTokens');
     if(!user){
         throw new APIError("Invalid Access Token", 401)
     }
     req.user = user;
     next();
   } catch (error) {
         throw new APIError(error?.message || 'Invalid Access Token', 401)
   }

})