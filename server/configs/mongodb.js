import mongoose from 'mongoose'
import dotenv from 'dotenv'


dotenv.config()
// conect
const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log('database is connected'))

    await mongoose.connect(`${process.env.MONGODB_URL}/lms`)
}

export default connectDB