import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.modal.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation not empty
    // check user if already registerd: email, username
    // check for images : Avatar
    // uploade them to clodinary: Avatar, cover Image
    // create user object and create entry on db
    // remove pasword and refesh token field from response
    // check for user creation
    // return respone

    const {email, username, fullName, password} = req.body
    
    // if(fullName == ""){
    //     throw new ApiError(400, "fullname is required")
    // }  
    // we can check conditions with if eles or we can use [some] method

    if([email, username, fullName, password].some((item)=>{
        item?.trim() == ""
    })){
        throw new ApiError(404, "All fields are required")
    }

   const existedUser =  User.findOne({
        $or: [{email},{username}]
    })
    console.log("existedUser -" , existedUser);

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avtar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avtar image is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // cheking user is created pr not and removing password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Somethig went wrong user is not created")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registerd successfully")
    )
})

export {registerUser}