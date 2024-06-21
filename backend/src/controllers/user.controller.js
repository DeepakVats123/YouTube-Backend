import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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
       console.log("userID-", userID);
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
    const {email,username, password} = req.body
    console.log(username, email, password);

    if(!username && !email){
        throw new ApiError(401, "Username or email is required")
    }
    const user = await User.findOne({
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

    const loggedInUser = await User.findById(user._id).select("-refreshToken")

    const options = { httpOnly: true, secure: true }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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
            $unset : {
                refreshToken: 1
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
    .json(new ApiResponse(200,{},"User logged Out",options))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refresh token 1st from cookie/body 

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // console.log("incomingRefreshToken",incomingRefreshToken);

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)

        console.log("decodedToken" , decodedToken);
        console.log("user" , user?.refreshToken);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if(decodedToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }

        const {accessToken, refreshToken} = await genrateAccessAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            ApiResponse(
                200,
                {accessToken,refreshToken},
                "Access token & refreshToken are  refreshed"
            )
        )



    } catch (error) {
        throw new ApiError(401, "Refresh Token not found") 
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
        const {oldPassword, newPassword} = req.body

        const user = await User.findById(req.user._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
            throw new ApiError(401, "Current password is incorrect")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false})

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
}) 

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "Fetch user data successfully"
    ))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const {username, email, fullName} = req.body

    if(!username || !email || !fullName){
        throw new ApiError(401, "All fields are required")
    }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : {
                    username,
                    email,
                    fullName
                }
            },
            {new: true}
        ).select("-password")

        return res
        .status(200)
        .json((new ApiResponse(200,user,"User details updated successfully")))
    
})

const updateAvtarImage = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(401, "avatar not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(401, "avatar not found")
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar : avatar.url
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar image updated")
    )

})

const updateCoverImage = asyncHandler( async (req, res) => {
    const coverLocalPath = req.file?.path

    if(!coverLocalPath){
        throw new ApiError(401, "cover not found")
    }

    const cover = await uploadOnCloudinary(coverLocalPath)

    if(!cover.url){
        throw new ApiError(401, "Cover Image not found")
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage : cover.url
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover image updated")
    )

})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateAvtarImage,
    updateCoverImage
}
