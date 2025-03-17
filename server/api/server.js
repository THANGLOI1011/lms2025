import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from '../configs/mongodb.js'
import { clerkWebhooks } from '../controllers/webhooks.js'

const app = express()

// Kết nối database
await connectDB()

// Middleware
app.use(express.json()); // Đảm bảo middleware JSON trước khi xử lý webhook

app.post("/clerk", (req, res, next) => {
    console.log("Webhook Headers:", req.headers);
    console.log("Webhook Body:", req.body);
    next();
}, clerkWebhooks);

export default app
