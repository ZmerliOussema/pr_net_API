const { WebSocketServer } = require('ws');
const { createServer } = require('http');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const OsmondAuth = require('./osmond_modules/osmond');
const DeviceManager = require('./osmond_modules/deviceManager');

let deviceManager = new DeviceManager();
let deviceName = 'n215253';

const httpServer = createServer();
const server = new WebSocketServer({ noServer: true });

// Gain Access to the device
const gainAccessJsonRPC = {
    jsonrpc: '2.0',
    method: 'UseDevice',
    params: { "Index": "0" },
    id: 1
};

// Set the Event 'UserMessage'
const userMessageJsonRPC = {
    jsonrpc: '2.0',
    method: 'SetEvent',
    params: { "EventType": "UserMessage" },
    id: 1
};

// Set the Property 'proc-tun_ocr'
const changeOCRJsonRPC = {
    jsonrpc: '2.0',
    method: 'SetProperty',
    params: ["ocr_module", "procr-tun_ocr-2.0.8.210_23Q3-arm64"],
    id: 1
};

// Set the Event 'PresenceDetection'
const presenceDetectEventJsonRPC = {
    jsonrpc: '2.0',
    method: 'SetEvent',
    params: { "EventType": "PresenceDetection" },
    id: 1
};

// Set the Task 'Detection'
const detectionTaskJsonRPC = {
    jsonrpc: '2.0',
    method: 'StartTask',
    params: { "Task": "Detection" },
    id: 1
};

// Scanning
const scanJsonRPC = {
    jsonrpc: '2.0',
    method: 'Scan',
    params: { "Lights": ["White", "Infra", "UV"] },
    id: 1
};

// Get VIZ Data
const getVizDataJsonRPC = {
    jsonrpc: '2.0',
    method: 'Analyze',
    params: {
        "Page": 0,
        "Task": ["Mrz.DocumentNumber", "Viz.DocumentNumber"]
    },
    id: 10
};

// Function to extract both Mrz.DocumentNumber and Viz.DocumentNumber
function getDocumentNumberFieldValue(data) {
    const fieldList = data.result.FieldList;
    const mrzDocumentNumberField = fieldList.find(field => field.Field === "Mrz.DocumentNumber");
    const vizDocumentNumberField = fieldList.find(field => field.Field === "Viz.DocumentNumber");

    const mrzDocumentNumber = mrzDocumentNumberField ? mrzDocumentNumberField.FieldValue : null;
    const vizDocumentNumber = vizDocumentNumberField ? vizDocumentNumberField.FieldValue : null;

    return { mrzDocumentNumber, vizDocumentNumber };
}


// Function to send the Get VIZ Data request
async function sendGetVizDataRequest(channel) {
    try {
        await channel.send(JSON.stringify(getVizDataJsonRPC));
        console.log('Get VIZ Data request sent.');
    } catch (error) {
        console.error('Error sending Get VIZ Data request:', error);
    }
}

// Function to handle the Scan completion
function handleScanCompletion(data, channel) {
    try {
        const parsedData = JSON.parse(data);
        console.log(data.toString());

        // Check if the scan is complete (result is true, id matches the scan request)
        if (parsedData && parsedData.result === true && parsedData.id === 1) {
            console.log('Scan completed successfully. Sending Get VIZ Data request...');

            // Delay the Get VIZ Data request for a short time to ensure the scan results are ready
            setTimeout(() => sendGetVizDataRequest(channel), 500); // 500ms delay
        }
    } catch (error) {
        console.error("Error processing scan completion:", error);
    }
}


// // Function to extract the desired FieldValue
// function getDocumentNumberFieldValue(data) {
//     const fieldList = data.result.FieldList;
//     const documentNumberField = fieldList.find(field => field.Field === "Mrz.DocumentNumber");
//     return documentNumberField ? documentNumberField.FieldValue : null;
// }


// Link the http server and the webSocket server together
httpServer.on('upgrade', (request, socket, head) => {
    server.handleUpgrade(request, socket, head, (ws) => {
        server.emit('connection', ws, request);
    });
});

// Begin the login process
let osmond = new OsmondAuth(
    "https://OSMOND-N215253.easytek.tn:3000",
    "oussema",
    "oussema_96"
);

// Setup WebSocket connection and event listener
async function setupDeviceChannel() {
    try {
        console.log("Starting device login...");

        // Perform HTTP login to get the API token
        const api_token = await osmond.httpLogin();
        console.log("API Token received:", api_token);

        // Perform WebSocket login
        let deviceChannel = await osmond.wsLogin(api_token);
        console.log("Device channel established:");

        if (deviceChannel && deviceChannel.channel) {
            deviceManager.setCommunicationChannel(deviceName, deviceChannel);
            console.log("Communication channel set for device:", deviceName);

            // Set up a listener for asynchronous events (like PresenceDetection, Scan completion, VIZ data)
            deviceChannel.channel.on('message', (data) => {
                // console.log('Raw message received:', data);
                handleAsynchronousEvents(data, deviceChannel.channel);
            });

            return deviceChannel;
        } else {
            throw new Error('Failed to establish WebSocket connection to the device.');
        }
    } catch (error) {
        console.error("Error in setupDeviceChannel:", error);
        throw error;
    }
}

// Function to send the Scan request via WebSocket
async function sendScanRequest(channel) {
    try {
        await channel.send(JSON.stringify(scanJsonRPC));
        console.log('Scan request sent.');
    } catch (error) {
        console.error('Error sending Scan request:', error);
    }
}

// Function to handle asynchronous events (including Scan and VIZ data retrieval)
function handleAsynchronousEvents(data, channel) {
    try {
        const parsedData = JSON.parse(data);

        // Presence detection event handling
        if (parsedData && parsedData.method === "PresenceDetection") {
            console.log("PresenceDetection notification received:", parsedData);

            if (parsedData.params && parsedData.params.State === "Present") {
                console.log("Document is present. Sending Scan and Get VIZ Data request...");

                // Send Scan request
                sendScanRequest(channel);

                // Send Get VIZ Data request shortly after Scan
                setTimeout(() => sendGetVizDataRequest(channel), 1000); // Delay to ensure data availability
            }
        }

        // Handle response for scan completion
        handleScanCompletion(data, channel);

        // Process any VIZ data received
        if (parsedData.result && Array.isArray(parsedData.result.FieldList)) {
            const { mrzDocumentNumber, vizDocumentNumber } = getDocumentNumberFieldValue(parsedData);

            if (mrzDocumentNumber) {
                console.log("MRZ Document Number received:", mrzDocumentNumber);
            } else {
                console.log("No MRZ Document Number found in the VIZ data.");
            }

            if (vizDocumentNumber) {
                console.log("VIZ Document Number received:", vizDocumentNumber);
            } else {
                console.log("No VIZ Document Number found in the VIZ data.");
            }
        }
    } catch (err) {
        console.error("Error processing asynchronous event:", err);
    }
}


// Helper function to send JSON-RPC and wait for a response
function sendJsonRpcWithResponse(channel, request) {
    return new Promise((resolve, reject) => {
        let responseReceived = false;

        // Send the JSON-RPC request
        channel.send(JSON.stringify(request), (err) => {
            if (err) {
                return reject(err);
            }
            console.log(`Request sent: ${request.method}`);
        });

        // Set up a listener to wait for the response
        const onMessage = (data) => {
            try {
                const parsedData = JSON.parse(data);

                // Ensure we received a response for the correct request ID
                if (parsedData.id === request.id) {
                    responseReceived = true;
                    console.log(`Response received for ${request.method}:`, parsedData);
                    channel.off('message', onMessage); // Remove listener after response
                    resolve(parsedData); // Resolve the promise with the response
                }
            } catch (err) {
                console.error('Error parsing response:', err);
                reject(err);
            }
        };

        channel.on('message', onMessage);

        // Timeout in case the response is not received within a reasonable time
        setTimeout(() => {
            if (!responseReceived) {
                channel.off('message', onMessage); // Remove listener on timeout
                reject(new Error(`Timeout waiting for response to ${request.method}`));
            }
        }, 5000); // Set the timeout (e.g., 5 seconds)
    });
}

async function sendJsonRpcRequests(channel) {
    try {
        // Send requests sequentially, waiting for each response before proceeding
        await sendJsonRpcWithResponse(channel, gainAccessJsonRPC);
        console.log('Gain Access JSON-RPC completed.');

        await sendJsonRpcWithResponse(channel, userMessageJsonRPC);
        console.log('UserMessage Event JSON-RPC completed.');

        await sendJsonRpcWithResponse(channel, changeOCRJsonRPC);
        console.log('Change OCR JSON-RPC completed.');

        await sendJsonRpcWithResponse(channel, presenceDetectEventJsonRPC);
        console.log('PresenceDetection Event JSON-RPC completed.');

        await sendJsonRpcWithResponse(channel, detectionTaskJsonRPC);
        console.log('Detection Task JSON-RPC completed.');

        // Optionally send the Scan request
        // await sendJsonRpcWithResponse(channel, scanJsonRPC);
        // console.log('Scan JSON-RPC completed.');

    } catch (err) {
        console.error('Error in JSON-RPC chain:', err);
    }
}

setupDeviceChannel().then((communicationChannel) => {
    // Listen for the 'open' event on the communication channel
    communicationChannel.channel.on("open", () => {
        console.log("deviceChannel opened to OSMOND device:");

        // Now that the WebSocket is open, send the JSON-RPC requests
        sendJsonRpcRequests(communicationChannel.channel);
    });

    server.on('connection', (ws) => {
        console.log('New client connected');

        communicationChannel.channel.on("message", function message(data) {
            try {
                const parsedData = JSON.parse(data);
                if (parsedData && parsedData.result && Array.isArray(parsedData.result.FieldList)) {
                    const documentNumber = getDocumentNumberFieldValue(parsedData);
                    console.log("Document Number:", documentNumber);
                } else {
                    console.log("message from OSMOND device:" + data);
                }
            } catch (error) {
                console.error("Error processing message from OSMOND device:", error);
            }

            ws.send(data.toString("utf8"));
            console.log("Message transmitted to Vue application");
        });

        communicationChannel.channel.on("close", () => {
            ws.close();
            console.log("deviceChannel closed, ws connection to Vue application closed.");
        });

        ws.on('message', (message) => {
            console.log(`Received from webSocket client: ${message}`);
            communicationChannel.channel.send(message);
            console.log(`Message transmitted to deviceChannel (OSMOND device)`);
        });

        ws.on("error", function message(data) {
            console.log("ws error");
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}).catch((err) => {
    console.error(err);
});

console.log('WebSocket server is running on ws://localhost:9090');
httpServer.listen(9090);