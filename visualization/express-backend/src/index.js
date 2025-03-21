import express from 'express';
import dotenv from 'dotenv';
import consumerRun from "./consumer.js";
import {websocket1,websocket2, startWebSocketServer} from "./service/websocket.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;
const TOPIC1 = process.env.KAFKA_TOPIC1 || "realtime_data_apple";
const TOPIC2 = process.env.KAFKA_TOPIC2 || "realtime_data_samsung";

const init = async () => {
    await startWebSocketServer();
    await consumerRun("realtime_data_group1", TOPIC1, websocket1);
    await consumerRun("realtime_data_group2", TOPIC2, websocket2);
}

app.listen(PORT, async ()=>{
    console.log(`Server is running on port ${PORT}`);
    await init();
})