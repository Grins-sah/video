import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ host: '192.168.0.250', port: 8080 });

import fs from 'fs'
interface User {
    ws: WebSocket;
    name: string;
    cctvId: string;
}

const activeUsers: User[] = [];

// Handle new WebSocket connections
wss.on("connection", (ws, req) => {
    console.log("New connection established:", req.socket.remoteAddress);

    // Add the connected user to the active users list
    const newUser: User = { ws, name: "Anonymous", cctvId: "Unknown" };
    activeUsers.push(newUser);

    // Handle incoming messages (video frames)
// Remove fs.writeFileSync (only for debug) — optional
// Don't transform the data — send as-is
ws.on("message", (data) => {
    
  // Broadcast to other clients
  activeUsers.forEach((user) => {
    if (user.ws !== ws && user.ws.readyState === ws.OPEN) {
      user.ws.send(data); // Send original data
    }
  });
});

    // Handle WebSocket close event
    ws.on("close", () => {
        console.log("Connection closed:", req.socket.remoteAddress);
        const index = activeUsers.findIndex((user) => user.ws === ws);
        if (index !== -1) {
            activeUsers.splice(index, 1);
        }
    });

    // Handle WebSocket error event
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

console.log("WebSocket server is running on ws://localhost:8080");
