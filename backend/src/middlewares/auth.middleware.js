import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.modal.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // trying to find accessToken from cookie or header 
   try {
     const Token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if(!Token){
         throw new ApiError(401, "Unauthorized request")
     }
 
     // if we got token we need to check the token valid or not with the
     // help of jwt, because we need to decode the token with the help of 
     // accessToken- secret
 
     const decodeToken = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodeToken?._id).select("-passsword -refreshToken")
     if(!user){
         throw new ApiError(401, "Invalid Access Token")
     }
     
     req.user = user
     // we can use req.user now 
         next()

   } catch (error) {
        throw new ApiError(401, "Invalid Access Token")
   }
})