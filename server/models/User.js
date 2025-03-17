import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: false }, // Không bắt buộc để tránh lỗi
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
