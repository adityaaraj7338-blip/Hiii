import userModel from "../models/User.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {upsertStreamUser} from "../config/stream.js";

export async function signup(req, res) {
    const { fullName, email, password } = req.body;
    try {
        if (!email || !fullName || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        //todo: need to add avatar for the users
        const newUser = await userModel.create({
            email,
            fullName,
            password 
        });
        
        await upsertStreamUser({
        id:newUser._id.toString(),
        name: newUser.fullName,
        })

        console.log(`Stream user created for ${newUser.fullName}`)
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "2d"
        });

        res.cookie('jwt', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        res.status(201).json({ success: true, user: newUser });

    } catch (error) {
        console.log('Error in signup:', error.message);
        res.status(500).json({ message: "Internal Server error" });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

        // FIX 2: Change 'newUser' to 'user'
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "2d"
        });

        res.cookie('jwt', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        res.status(200).json({ success: true, user });

    } catch (error) {
        console.log("Error in login controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
export function logout(req,res){
    res.clearCookie("jwt")
    res.status(200).json({success:true,message: "Logout successful" })
}

export async function onboard(req,res){
    try{
        const userId= req.user._id;
        const {fullName,bio,nativeLanguage,learningLanguage,location} = req.body
        if (!fullName, !bio ,!nativeLanguage,!learningLanguage,!location){
            return res.status(400).json({
                message:"All fields are required",
                missingFields:[
                    !fullName && "fullName",
                    !bio && 'bio',
                    // !nativeLanguage && 'nativeLanguage',
                    // !learningLanguage && 'learningLanguage',
                    !location && 'location'
                ].filter(Boolean)
            })
        }
        const updatedUser = await userModel.findByIdAndUpdate(userId,{
            ...req.body,
            isOnboarded: true
        },{new:true})//will give updated user
        if(!updatedUser)
            return res.status(404).json({message: "User not found"})


        try {
        await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "", 
        // Pass custom fields here
        bio: updatedUser.bio,
        location: updatedUser.location,
        // nativeLanguage: updatedUser.nativeLanguage,
        // learningLanguage: updatedUser.learningLanguage
        });
        console.log("Stream user updated with onboarding data");
        } catch (streamError) {
         console.error("Stream API Error:", streamError.message);
        }
         }catch(error){
        console.error('Onboarding error:',error)
        res.status(500).json({message:"Internal Server error"})

         }
}
