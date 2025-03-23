import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URL;
        if (!dbURI) {
            throw new Error("⚠️ MONGODB_URL is not defined in environment variables.");
        }

        await mongoose.connect(dbURI, {
            dbName: "lms",
        });

        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1); // Dừng server nếu kết nối thất bại
    }
};

export default connectDB;
