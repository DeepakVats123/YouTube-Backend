import mongoose, {Schema} from "mongoose"

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
        fullname: {
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

export const User = mongoose.model("User", userSchema)