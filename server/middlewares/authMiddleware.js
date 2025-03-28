import { clerkClient } from "@clerk/express";

export const protecEducator = async (req, res, next) => {
    try {
        // Kiểm tra req.auth tồn tại
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. No user ID found.' });
        }

        const userId = req.auth.userId;
        const response = await clerkClient.users.getUser(userId);

        // Kiểm tra publicMetadata có tồn tại không
        if (!response.publicMetadata || response.publicMetadata.role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Access denied. Educator role required.' });
        }

        // Nếu người dùng hợp lệ, tiếp tục
        next();
    } catch (error) {
        console.error("Error in protecEducator middleware:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
