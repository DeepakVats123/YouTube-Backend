import { Router } from "express";
import { logOutUser, loginUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage"
        }
    ]),
    registerUser
)

router.route("login").post(loginUser)

// secured routes 
// we can use auth middleware before method
router.route("logout").post(verifyJWT, logOutUser)


export default router