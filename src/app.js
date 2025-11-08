import express  from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.static('public'))
app.use(cookieParser())  


// Import Routes 
import userRoutes from "./routes/user.routes.js";

// Use Routes
app.use('/api/v1/users', userRoutes)

export default app;