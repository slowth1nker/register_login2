require('./config/db');


const app = require('express')();
const port=process.env.PORT||5000;

//const UserRouter=require('./api/User');
//cors
require("dotenv").config();
const cors=require("cors");
app.use(cors());

const UserRouter=require("./api/User");

//for accepting post form data
const bodyParser= require('express').json;
app.use(bodyParser());

app.use('/user',UserRouter)
app.listen(port,()=>{
    console.log(`server running on port ${port}`) ;
})