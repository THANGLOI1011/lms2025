import { clerkClient } from "@clerk/express";

export const protecEducator = async(req,res,next) => {
    try{
        const userId = req.auth.userId;
        const response = await clerkClient.users.getUser(userId);

        if(response.publicMetadata.role !== 'educator'){
            return res.status(403).json({ success: false, message: 'Unauthorized Access' });
        }
        next();
    } catch(error){
        console.error("Error in protecEducator middleware:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}