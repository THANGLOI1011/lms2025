import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from '../configs/mongodb.js'
import { clerkWebhooks } from '../controllers/webhooks.js'
import educatorRouter from '../routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import connectCloudinary from '../configs/cloudinary.js'
import { requireAuth } from '@clerk/express'

const app = express()

// Kết nối database
await connectDB()
await connectCloudinary()
// Middleware
app.use(express.json()); // Đảm bảo middleware JSON trước khi xử lý webhook
app.use(clerkMiddleware())
app.get('/',(req,res) => res.send('Api working'))
app.post("/clerk", (req, res, next) => {
    console.log("Webhook Headers:", req.headers);
    console.log("Webhook Body:", req.body);
    next();
}, clerkWebhooks);
app.use('/api/educator', requireAuth(), educatorRouter);
// port
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log('Server is runing')
})
export default app
