import { clerkClient } from "@clerk/express";

// middleware (protect educator route)

export const protecEducator = async(req,res,next) => {
    try{
        const userId = req.auth.userId
        const response = await clerkClient.users.getUser(userId)
        if(response.publicMetadata.role != 'educator'){
            return res.json({success:true,message:'Unauthorized Access'})
        }
        next()
    }catch(error){
        res.json({success:false,message:error.message})
    }
}