import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const dbURI = `${process.env.MONGODB_URL}/lms`;
        console.log(`Connecting to MongoDB at: ${dbURI}`);

        await mongoose.connect(dbURI, {
            dbName: "lms"
        });

        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
};

export default connectDB;
