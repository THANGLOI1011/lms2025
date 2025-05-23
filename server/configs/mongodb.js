import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URL;
        if (!dbURI) {
            throw new Error(" MONGODB_URL is not defined in environment variables.");
        }

        await mongoose.connect(dbURI, {
            dbName: "lms",
        });
    } catch (error) {
        process.exit(1);
    }
};

export default connectDB;
