import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from '../configs/mongodb.js';
import { clerkWebhooks, stripeWebhooks } from '../controllers/webhooks.js';
import educatorRouter from '../routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from '../configs/cloudinary.js';
import { requireAuth } from '@clerk/express';
import courseRRouter from '../routes/courseRoute.js';
import userRouter from '../routes/userRoutes.js';

const app = express();

// Kết nối database và Cloudinary
await connectDB();
await connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json()); // Đảm bảo middleware JSON trước khi xử lý webhook
app.use(clerkMiddleware());

// Route kiểm tra API hoạt động
app.get('/', (req, res) => res.send('API working'));

// Route xử lý webhook từ Clerk
app.post("/clerk", (req, res, next) => {
    console.log("Webhook Headers:", req.headers);
    console.log("Webhook Body:", req.body);
    next();
}, clerkWebhooks);

// Routes dành cho Educator (Cần xác thực)
app.use('/api/educator', requireAuth(), educatorRouter);
app.use('/api/course', express.json(),courseRRouter)
app.use('/api/user',express.json(), userRouter)
app.post('/stripe',express.raw({type:'application/json'}),stripeWebhooks)

// Lắng nghe server
const PORT = process.env.PORT || 5000;
try {
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("❌ Server failed to start:", error);
}

export default app;
