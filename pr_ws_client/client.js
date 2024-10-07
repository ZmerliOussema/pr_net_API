const WebSocket = require('ws');

// Replace 'ws://localhost:8080' with the WebSocket server address
const ws = new WebSocket('ws://localhost:9090');

// // Subscribe to UserMessage Event
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'SetEvent',
//     params: {"EventType": "UserMessage"},
//     id: 1
// }; 

// Get the image
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'GetImage',
//     params: {"Light": "Infra", 
//         "DocView": 2,
//         "Format": "image/jpeg",
//         "Dpi": 150,
//         "Base64": true,
//         "Quality": 90
//     },
//     id: 1
// };

// Scanning
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'Scan',
//     params: {"Lights": ["White", "Infra", "UV"]},
//     id: 1
// };

// // Select the engine
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'SetProperty',
//     params: ["ocr_module","procr-tun_ocr-2.0.8.210_23Q3-arm64"],
//     id: 1
// };

// // Get Viz data
const jsonRpcMessage = {
    jsonrpc: '2.0',
    method: 'Analyze',
    params: { "Page": 0,
        "Task": ["Mrz.DocumentNumber", "Viz.DocumentNumber"]},
    id: 10
};

// // Deletion of all the images and documents data stored in Memory
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'CleanUp',
//     params: {},
//     id: 2
// };

//Gain access to the device
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'UseDevice',
//     params: {"Index": "0"},
//     id: 1
// };

// // Subscribing to the event notification
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'SetEvent',
//     params: {"EventType": "PresenceDetection"},
//     id: 1
// }; 

// // Sending the detection request
// const jsonRpcMessage = {
//     jsonrpc: '2.0',
//     method: 'StartTask',
//     params: {"Task": "Detection"},
//     id: 1
// };

// Event: When the connection is established
ws.on('open', function open() {
    console.log('Connected to the server');
    
    // Send a message to the server
    ws.send(JSON.stringify(jsonRpcMessage));
    console.log("Message transmitted to the server ...");
});

// Event: When a message is received from the server
ws.on('message', function message(data) {
    console.log('Received message from server:', data.toString());
});

// Event: When the connection is closed
ws.on('close', function close() {
    console.log('Disconnected from the server');
});

// Event: When an error occurs
ws.on('error', function error(err) {
    console.error('Error occurred:', err);
});
