import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from '../configs/mongodb.js'
import { clerkWebhooks } from '../controllers/webhooks.js'

const app = express()

// Kết nối database
await connectDB()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => res.send('API Working'))
app.post('/clerk', clerkWebhooks)

// ✅ Xuất API thay vì `app.listen()`
export default app
