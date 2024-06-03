import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            require: true 
        },
        thumbnail: {
            type: String, //cloudnary Url
            require: true  
        },
        title: {
            type: String,
            require: true  
        },
        description:{
            type: String,
            require: true
        },
        duration: {
            type: Number,
            require: true  
        },
        views: {
            type: String,
            default: 0 
        },
        isPublish: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"  
        }
    },
    {
        timestamps: true
    }
)

export const Video = mongoose.model("User", videoSchema)