import { generateStreamToken } from "../config/stream";

export async function getStreamToken(req,res){
    try {
        const token = generateStreamToken(req.user.id)
        req.status(200).json({token})
    } catch (error) {
        console.error("Error in getStreamToken controller",error.message)
        res.status(500).json({message:"Internal Server Error"})
    }
}