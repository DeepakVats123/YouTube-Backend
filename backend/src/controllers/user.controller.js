import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// saprately creating for reuse 
const genrateAccessAndRefreshToken = async (userID) => {
    try {
         const user = await User.findById(userID)
         const accessToken = await user.createAccessToken()
         const refreshToken = await user.createRefreshToken()

         user.refreshToken = refreshToken
         user.save({validateBeforeSave: false})

         return {accessToken, refreshToken}

    } catch (error) {
       throw new ApiError(500, "something went wrong while genrating Access & Refresh token") 
    }

}

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

    if([email, username, fullName, password].some((item) => {
        item?.trim() == ""
    })){
        throw new ApiError(404, "All fields are required")
    }

   const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    console.log("existedUser -" , existedUser);

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    // if avatar is compulsory we can check path like this also we can check with if else
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(req.files);
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // there is another way because we don't requird coverImage compulsory so i- 
    // want if there is no coverImage from frontend it will take empty string 

    let coverImageLocalPath;
    if(req.files && req.files.coverImage && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }



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

const loginUser = asyncHandler( async (req, res) => {
    // take data from req body 
    // find username or email or both 
    // check the password 
    // create access & refersh token
    // send the cookie

    const {username, email, password} = req.body

    if(!(username || email)){
        throw new ApiError(401, "Username or email is required")
    }
    const user = User.findOne({
        $or: [{username}, {email}]
    })
    
    if(!user){
        throw new ApiError(404, "User doesn't exiest")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user password")
    }

    const {accessToken, refreshToken} = await genrateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = { httpOnly: true, secure: true }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshCookie", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "User logged in successfully"
        )
    )
})

const logOutUser = asyncHandler( async (req, res) => {
    // here we don't have any data from body that's why we need to create auth middleware
    User.findByIdAndUpdate(
       await req.user._id,
        {
            $set : {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = { httpOnly: true, secure: true }

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200,{},"User logged Out"))
})
export {registerUser, loginUser, logOutUser}