import FriendRequest from "../models/FriendRequest.js";
import userModel from "../models/User.js";

export async function getRecommendedUsers(req,res){
try {
    const currentUserId = req.user.id;
    const currentUser = req.user;
    const recommendedUsers = await userModel.find({
        $and:[
            {_id:{$ne:currentUserId}}, //exclude the current user
            {$id:{$nin:currentUser.friends}}, //exclude current friends of the users
            {isOnboarded: true}
        ]
    })
    res.status(200).json(recommendedUsers)
} catch (error) {
    console.error('Error in getRecommendedUsers controller',error.message);
    res.status(500).json({message:"Internal Server Error"})
    
}
}


export async function getMyFriends(req,res){
    try {
        const user = await userModel.findById(req.user.id).select("friends").populate("friends","fullName profilePic nativeLanguage learningLanguage")

        res.status(200).json(userModel.friends)
    } catch (error) {
        console.error("Error in getMyFriends controller",error.message)
        res.stauts(500).json({message: "Internal Server Error"})
    }
}


export async function sendFriendRequest(req,res){
    try {
        const myId = req.user.id;
        const {id:recipientId} = req.params

        if(myId===recipientId)
            return res.status(400).json({message:"YOu can't send friend request to yourself"})
        const recipient = await userModel.findById(recipientId)
        if(!recipient)
            return res.status(400).json({message:"Recipient Not Found"})

        if (recipient.friends.includes(myId)){
            return res.status(400).json({message:"You are already friends with the user"})
        }

        //check if a request already sent

        const existingRequest = await FriendRequest.findOne({
            $or:[
                {
                    sender:myId,recipient:recipientId 
                },
                {
                    recipient:myId,sender:recipientId 
                }
            ]
        })

        if (existingRequest){
            return res.status(400).json({message:"A friend request already exists between you and this user"})
        }


        const friendRequest = await FriendRequest.create({
            sender:myId,
            recipient: recipientId,
        });
        res.status(201).json(friendRequest)
    } catch (error) {
        console.error("Error in friendRequest controller",error.message)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export async function acceptFriendRequest(req,res){
    try {
        const {id:requestId} = req.params
        const friendRequest = await FriendRequest.findById(requestId)

        if(!friendRequest)
            res.status(404).json({message:"Friend Request not found"})

        if (friendRequest.recipient.toString()!==req.user.id){
            return res.status(403).json({message:"You are not authorized to accept this request"})
        }

        friendRequest.status = "accepted";
        await friendRequest.save()

        //add each user to the other's friends array

        await userModel.findByIdAndUpdate(friendRequest.recipient,{
            $addToSet:{friends: friendRequest.sender}
        })

        await userModel.findByIdAndUpdate(friendRequest.sender,{
            $addToSet:{friends: friendRequest.recipient}
        })

        res.status(200).json({message:'Friend request accepted'})

    } catch (error) {
        console.log("Error in acceptFriendRequest controller",error.message)
    }
}

export async function getFriendRequests(req,res){
    try {
        const incomingReqs = await FriendRequest.find({
            recipient:req.user.id,
            status: "pending",
        }).populate("sender","fullName profilePic nativeLanguage learningLanguage")
        const acceptedReqs = await FriendRequest.find({
            recipient:req.user.id,
            status: "accepted",
        }).populate("sender","fullName profilePic")
        res.status(200).json({incomingReqs,acceptedReqs})
    } catch (error) {
        console.log("Error in getPendingFriendRequests controller",error.messaage)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export async function getOutgoingFriendReqs(req,res){
    try{
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage")
        res.status(200).json(outgoingRequests)
    }catch(error){
        console.log("Error in getOutgoingFriendReqs controller",error.message)
        res.status(500).json({message: "Internal Server error"})
    }
}
