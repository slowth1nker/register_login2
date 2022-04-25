const express = require('express');
const router = express.Router();
//mongodb user model
const User= require('./../models/User');
//mongodb user otp
const UserVerification=require("./../models/UserVerification");
const bcrypt=require('bcrypt');
const nodemailer=require("nodemailer");
const res = require('express/lib/response');
const { route } = require('express/lib/application');

 let transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    },
});

//testing 
transporter.verify((error,success)=>{
    if(error){
        console.log(error);
    }
    else{
        console.log("Ready for message");
        console.log(success);
    }
});


//signup
router.post('/signup',(req,res)=>{
    let{name,email,password}=req.body;
        name=name.trim();
        email=email.trim();
        password=password.trim();
        if(name=="" || email=="" || password==""){
            res.json({
                status:"FAILED",
                message: " An error occured",
            })
        }
        else{
            const saltRounds=10;
            bcrypt
            .hash(password,saltRounds)
            .then(hashedPassword=>{
                const newUser= new User({
                    name,
                    email,
                    password: hashedPassword,
                });
                newUser.save()
                .then(result=>{
                    //res.json({
                       // status:"Success",
                       // message:"Signup Successsful",
                    //data: result,
                    sendOTPVerification(result,res);
                    //});
                })
                .catch(err=>{
                    res.json({
                        status:"Failed",
                        message:"An error occured",
                    })
                })
            })
            .catch(err=>{
                res.json({
                    status:"Failed",
                    message:"An error occured",
                })
            })
        }
    });

const sendOTPVerification=async({_id,email},res)=>{
    try{
        const otp= `${Math.floor(1000+Math.random()*9000)}`;

        const mailOptions={
            from:process.env.AUTH_EMAIL,
            to: email,
            subject:"Verify your email",
            html: `<p>Enter ${otp} to verify</p>`,
        };

        const saltRounds=10;
        const hashedOTP=await bcrypt.hash(otp,saltRounds);
        const newVerification=await new UserVerification({
            userId: _id,
            otp: hashedOTP,
        });
        await newVerification.save();
        await transporter.sendMail(mailOptions);
        res.json({
            status:"PENDING",
            message:"Verification otp email sent",
            data:{
                userId: _id,
                email,
            },
        });
    } catch(error){
        res.json({
            status: "Failed",
            message: error.message
        });
    }
};

router.post("/verifyOTP",async(req,res)=>{
    try{
        let{userId,otp}=req.body;
       const UserVerificationRecords=await UserVerification.find({
            userId,
        });
        const hashedOTP= UserVerificationRecords[0].otp;
        const isValid=await bcrypt.compare(otp,hashedOTP);
        if(!isValid){
            throw new Error("Invalid OTP");
        }else{
            await User.updateOne({_id: userId},{verified:true});
            await UserVerification.deleteMany({userId});
            res.json({
                status: "verified",
                message: `Email has been verified`,
            });
        }
        
    } catch(error){
        res.json({
            status: "Failed",
            message: error.message
        });
    }
})
//signin

router.post('/signin',(req,res)=>{
    let{email,password}=req.body
    if(email=="" || password==""){
        res.json({
            status:"FAILED",
            message: " An error occured",
        })
    }
    else{
        User.find({email}).then(data=>{
            if(data.length){
                const hashedPassword=data[0].password;
                bcrypt.compare(password,hashedPassword).then(result=>{
                    if(result){
                        res.json({
                            status:"Success",
                            message:"Signin successful",
                            data:data,
                        })
                    }else{
                        res.json({
                            status:"FAILED",
                            message: " An error occured",
                        })
                    }
                })
            }else{
                res.json({
                    status:"FAILED",
                    message: " An error occured",
                })
            }
        })
    }
})


module.exports=router;