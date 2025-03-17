import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/lms`);
        console.log('Database connected successfully');

        // Kiểm tra nếu model đã tồn tại trước khi tạo mới
        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
        });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Thêm user mẫu để tạo database
        const existingUser = await User.findOne({ email: 'admin@example.com' });
        if (!existingUser) {
            await User.create({ name: 'Admin', email: 'admin@example.com' });
            console.log('User created, check your database!');
        } else {
            console.log('User already exists.');
        }

    } catch (error) {
        console.error('Database connection failed:', error);
    }
};

export default connectDB;
