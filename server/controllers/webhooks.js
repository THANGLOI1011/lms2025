import { Webhook } from "svix";
import User from "../models/User.js";
export const clerkWebhooks = async (req, res) => {
    try {
        console.log("🔹 Received Webhook Headers:", req.headers);
        console.log("🔹 Received Webhook Body:", req.body);

        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        const payloadString = JSON.stringify(req.body);
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        };

        whook.verify(payloadString, headers);
        console.log("✅ Webhook Signature Verified!");

        const { data, type } = req.body;

        switch (type) {
            case "user.created":
                console.log("📌 Creating User:", data);
                await User.create({
                    _id: data.id,
                    email: data.email_addresses[0]?.email_address || "No Email",
                    name: `${data.first_name || ""} ${data.last_name || ""}`,
                    imageUrl: data.image_url
                });
                return res.json({ success: true, message: "User created successfully" });

            case "user.updated":
                console.log("📌 Updating User:", data);
                await User.findByIdAndUpdate(data.id, {
                    email: data.email_addresses[0]?.email_address || "No Email",
                    name: `${data.first_name || ""} ${data.last_name || ""}`,
                    imageUrl: data.image_url
                });
                return res.json({ success: true, message: "User updated successfully" });

            case "user.deleted":
                console.log("📌 Deleting User:", data);
                await User.findByIdAndDelete(data.id);
                return res.json({ success: true, message: "User deleted successfully" });

            default:
                console.warn("⚠️ Unknown Event Type:", type);
                return res.status(400).json({ success: false, message: "Unknown event type" });
        }
    } catch (error) {
        console.error("❌ Webhook Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
