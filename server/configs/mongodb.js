import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Định nghĩa Schema cho User
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    imageUrl: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const connectDB = async () => {
    try {
        const dbURI = `${process.env.MONGODB_URL}/lms`;
        console.log(`Connecting to MongoDB at: ${dbURI}`);

        await mongoose.connect(dbURI, {
            dbName: "lms"
        });

        console.log('✅ Database connected successfully');

        // Thêm dữ liệu giả
        const existingUser = await User.findOne({ email: 'test@example.com' });
        if (!existingUser) {
            await User.create([
                { name: 'John Doe', email: 'john@example.com', imageUrl: 'https://example.com/john.jpg' },
                { name: 'Jane Smith', email: 'jane@example.com', imageUrl: 'https://example.com/jane.jpg' }
            ]);
            console.log('🎉 Dummy data added!');
        } else {
            console.log('⚡ Dummy data already exists.');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
};

export default connectDB;
