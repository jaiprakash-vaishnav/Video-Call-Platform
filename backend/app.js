import 'dotenv/config.js';
import express from "express";
import {createServer} from "node:http";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const port = 8000;
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || port));
app.use(cors({
    origin : "https://videocallplatformf.vercel.app"
}));
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb", extended:true}));

app.use("/api/v1/users",userRoutes);


// app.get("/",(req,res)=>{
//     console.log("root is hit");
//     res.send("working");
// });

const DBUrl = process.env.MONGODB_ATLAS;

const start = async()=>{
    app.set("mongo_user");
    const connectionDB = await mongoose.connect(DBUrl);
    console.log(`MongoDB connected Host : ${connectionDB.connection.host}`);
    server.listen(app.get("port"),()=>{
        console.log(`server is listing at ${port}`);
    });
}

start();
