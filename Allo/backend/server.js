import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.route.js'
import userRoutes from './src/routes/user.route.js'
import chatRoutes from './src/routes/user.route.js'
import { connection } from './src/config/db.js'
import cors from "cors";
import cookieParser from 'cookie-parser'
const app = express()

dotenv.config()
app.use(cookieParser())
const PORT = process.env.PORT || 3000
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true  //allow frontend to send the cookies
}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/api/auth',authRoutes)
app.use('/api/users',userRoutes)
app.use('/api/chat',chatRoutes)

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
    connection()
})