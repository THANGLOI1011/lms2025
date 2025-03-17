import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/lms`);
        console.log('Database connected successfully');

        // Kiểm tra nếu model đã tồn tại trước khi tạo mới
        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
        });

        mongoose.models.User = mongoose.models.User || mongoose.model('User', UserSchema);

    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

export default connectDB;
