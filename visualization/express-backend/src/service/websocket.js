import {WebSocketServer} from 'ws';

const websocket1 = new WebSocketServer({port: 6002});
const websocket2 = new WebSocketServer({port: 6001});

const startWebSocketServer = async () => {
    websocket1.on('connection', (ws)=>{
        console.log('Websocket server 1 connected');
    });
    websocket1.on('error', (error)=>{
        console.log('Websocket server 1 error', error);
    });
    websocket2.on('connection', (ws)=>{
        console.log('Websocket server  2 connected');
    });
    websocket2.on('error', (error)=>{
        console.log('Websocket server 2 error', error);
    });
}

export {startWebSocketServer, websocket1, websocket2};