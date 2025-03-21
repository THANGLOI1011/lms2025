import { Webhook } from "svix";
import User from "../models/User.js";
import dotenv from "dotenv";
import connectDB from "../configs/mongodb.js"; // Nếu dùng MongoDB
import Stripe from "stripe";
import { request } from "express";
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
        await connectDB(); // Kết nối MongoDB nếu cần

        // Lấy webhook secret từ biến môi trường
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        console.log("🔹 Clerk Webhook Secret:", process.env.CLERK_WEBHOOK_SECRET);

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
                try {
                    await User.create({
                        _id: data.id,
                        email: data.email_addresses[0]?.email_address || "No Email",
                        name: `${data.first_name || ""} ${data.last_name || ""}`,
                        imageUrl: data.image_url
                    });
                    return res.json({ success: true, message: "User created successfully" });
                } catch (dbError) {
                    console.error("❌ Error creating user in MongoDB:", dbError);
                    return res.status(500).json({ success: false, message: "Failed to create user in database" });
                }

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
}

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

export const stripeWebhooks = async(req,res) => {
    const sig = request.headers['stripe-signature']
    let event;
    try{
        event = Stripe.webhooks.constructEvent(request.body,sig,process.env.TRIPE_WEBHOOK_SECRET)
    }catch(err){
        res.status(400).send(`Webhooks Error: ${err.message}`)
    }

      // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':{
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent:paymentIntentId
      })
      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      const userData = await User.findById(purchaseData.userId)
      const courseData = await Course.findById(purchaseData.courseId.toString());

      courseData.enrolledStudents.push(userData)
      await courseData.save()
      userData.enrolledStudents.push(courseData._id)
      await userData.save()

      purchaseData.status = 'complete'
      await purchaseData.save()
      break;
    }
    case 'payment_intent.failed':{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
        payment_intent:paymentIntentId
      })
      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = 'failed'
      await purchaseData.save()

      


      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
}

export const config = {
    api: {
        bodyParser: false, // Hỗ trợ raw body cho webhook
    },
};
