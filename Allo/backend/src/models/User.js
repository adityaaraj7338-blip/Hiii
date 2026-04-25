import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    bio:{
        type: String,
        default: "",
    },
    profilePic:{
        type: String,
        default: ""
    },
    nativeLanguage:{
        type: String,
        default: ","
    },
    learningLanguage:{
        type: String,
        defalut: "",
    },
    location:{
        type: String,
        default: "",
    },
    isOnboarded:{
        type: Boolean,
        default: false,
    },
    friends:[
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref : "User",
        },
    ],
},
{
    timeseries: true
})


//pre hook
// pre hook
userSchema.pre("save", async function() {
    // 1. If password hasn't changed, move to the next middleware
    if (!this.isModified('password')) {
        return ;
    }

    // 2. Wrap the hashing logic in try/catch
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        console.log(err)
    }
});

userSchema.methods.matchPassword = async function(enteredPassword){
    const isPasswordCorrect = await bcrypt.compare(enteredPassword,this.password)
    return isPasswordCorrect
}

const userModel = mongoose.model('User',userSchema)



export default userModel