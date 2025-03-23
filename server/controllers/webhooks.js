import { Webhook } from "svix";
import User from "../models/User.js";
import dotenv from "dotenv";
import connectDB from "../configs/mongodb.js"; // Connect MongoDB
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

dotenv.config();

export const clerkWebhooks = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    console.log("🔹 Webhook Received!");
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body:", req.body);

    try {
        await connectDB(); // Connect MongoDB if needed

        if (!process.env.CLERK_WEBHOOK_SECRET) {
            console.error("❌ Missing CLERK_WEBHOOK_SECRET in environment variables");
            return res.status(500).json({ success: false, message: "Server misconfiguration" });
        }

        // Verify Clerk webhook
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
                console.log("📌 Creating User:", JSON.stringify(data, null, 2));
                try {
                    const userData = {
                        _id: data.id,
                        clerkId: data.id, // FIXED: Typo
                        email: data.email_addresses[0]?.email_address || "No Email",
                        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                        imageUrl: data.image_url
                    };

                    console.log("🛠️ Data to be inserted:", userData);

                    const newUser = await User.create(userData);
                    console.log("✅ User created successfully:", newUser);

                    return res.json({ success: true, message: "User created successfully" });
                } catch (dbError) {
                    console.error("❌ Error creating user in MongoDB:", dbError);
                    return res.status(500).json({ success: false, message: dbError.message });
                }

            case "user.updated":
                console.log("📌 Updating User:", JSON.stringify(data, null, 2));
                try {
                    await User.findByIdAndUpdate(data.id, {
                        email: data.email_addresses?.[0]?.email_address || "No Email",
                        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                        imageUrl: data.image_url
                    });
                    console.log("✅ User updated successfully");
                    return res.json({ success: true, message: "User updated successfully" });
                } catch (error) {
                    console.error("❌ Error updating user:", error);
                    return res.status(500).json({ success: false, message: error.message });
                }

            case "user.deleted":
                console.log("📌 Deleting User:", JSON.stringify(data, null, 2));
                try {
                    await User.findByIdAndDelete(data.id);
                    console.log("✅ User deleted successfully");
                    return res.json({ success: true, message: "User deleted successfully" });
                } catch (error) {
                    console.error("❌ Error deleting user:", error);
                    return res.status(500).json({ success: false, message: error.message });
                }

            default:
                console.warn("⚠️ Unknown Event Type:", type);
                return res.status(400).json({ success: false, message: "Unknown event type" });
        }
    } catch (error) {
        console.error("❌ Webhook Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Stripe Webhooks
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = Stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("❌ Stripe Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            try {
                const session = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntentId
                });

                if (!session.data.length) {
                    console.error("❌ No session found for payment intent:", paymentIntentId);
                    return res.status(400).json({ success: false, message: "Session not found" });
                }

                const { purchaseId } = session.data[0].metadata;
                const purchaseData = await Purchase.findById(purchaseId);
                if (!purchaseData) throw new Error("Purchase not found");

                const userData = await User.findById(purchaseData.userId);
                const courseData = await Course.findById(purchaseData.courseId.toString());

                if (!userData || !courseData) {
                    throw new Error("User or Course not found");
                }

                courseData.enrolledStudents.push(userData);
                await courseData.save();
                userData.enrolledStudents.push(courseData._id);
                await userData.save();

                purchaseData.status = 'complete';
                await purchaseData.save();

                console.log("✅ Payment success, enrollment updated");
            } catch (error) {
                console.error("❌ Error handling payment success:", error);
                return res.status(500).json({ success: false, message: error.message });
            }
            break;
        }

        case 'payment_intent.failed': {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            try {
                const session = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntentId
                });

                if (!session.data.length) {
                    console.error("❌ No session found for payment intent:", paymentIntentId);
                    return res.status(400).json({ success: false, message: "Session not found" });
                }

                const { purchaseId } = session.data[0].metadata;
                const purchaseData = await Purchase.findById(purchaseId);
                if (!purchaseData) throw new Error("Purchase not found");

                purchaseData.status = 'failed';
                await purchaseData.save();

                console.log("✅ Payment failed, purchase updated");
            } catch (error) {
                console.error("❌ Error handling payment failure:", error);
                return res.status(500).json({ success: false, message: error.message });
            }
            break;
        }

        default:
            console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
};

// Enable raw body parsing for webhooks
export const config = {
    api: {
        bodyParser: false,
    },
};
