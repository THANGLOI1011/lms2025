import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Định nghĩa _id là String vì dùng Clerk ID
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: false }, // Không bắt buộc để tránh lỗi
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }] // Thêm enrolledCourses
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;