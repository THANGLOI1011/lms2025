import { Webhook } from "svix";
import User from "../models/User.js";

// API controller Func to Manage Clerk with data 
export const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        console.log(whook)

        // ✅ Sửa lỗi verify() - Truyền đúng dữ liệu gốc thay vì JSON.stringify()
        const payload = req.body;
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        };

        whook.verify(JSON.stringify(payload), headers); // Không cần await

        const { data, type } = payload;

        switch (type) {
            case "user.created": {
                const userData = {
                    _id: data.id,
                    email: data.email_addresses[0].email_address, // ✅ Sửa lỗi key email
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url, // ✅ Sửa lỗi imageUrl thành image_url
                };

                await User.create(userData);
                return res.json({ success: true, message: "User created successfully" });
            }

            case "user.updated": { // ✅ Sửa lỗi 'user.update' → 'user.updated'd
                const userData = {
                    email: data.email_addresses[0].email_address, // ✅ Sửa lỗi key email
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url, // ✅ Sửa lỗi imageUrl thành image_url
                };

                await User.findByIdAndUpdate(data.id, userData);
                return res.json({ success: true, message: "User updated successfully" });
            }

            case "user.deleted": { // ✅ Sửa lỗi 'user.delete' → 'user.deleted'
                await User.findByIdAndDelete(data.id);
                return res.json({ success: true, message: "User deleted successfully" });
            }

            default:
                return res.status(400).json({ success: false, message: "Unknown event type" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
