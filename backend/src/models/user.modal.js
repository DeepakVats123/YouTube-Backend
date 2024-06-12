import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken";
import bycrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            require: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            require: true,
        },
        coverImage: {
            type: String,
            require: true,
        },
        watchHistory: {
            type: Schema.Types.ObjectId,
            ref: "Video" 
        },
        password: {
            type: String,
            require: [true,'Password is required']
        }

    },
    {
        timestamps: true
    }
)

// pre is a Mongoose's Hook  xyz.pre("save", function)  here save is an event.
// don't use arrow function inside pre hook because arrow function don't
//   have refrence of this that's why use normal function.

userSchema.pre("save", async function(next){
    this.password = await bycrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bycrypt.compare(password, this.password)
}



userSchema.methods.createAccessToken = function(){
    return jwt.sign({
        _id: this.id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.createRefreshToken = function(){
    return jwt.sign({
        _id: this.id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: REFRESH_TOKEN_EXPIRY
    }
)
}


export const User = mongoose.model("User", userSchema)