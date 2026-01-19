import type { SupervisorMessage } from "../core/types";

type MessageCallback = (msg: SupervisorMessage) => void;

export class SupervisorService {
    private static instance: SupervisorService;
    private listeners: MessageCallback[] = [];
    private socket: WebSocket | null = null;
    private isConnected = false;
    private readonly URL = "ws://localhost:8087";

    private constructor() { }

    public static getInstance(): SupervisorService {
        if (!SupervisorService.instance) {
            SupervisorService.instance = new SupervisorService();
        }
        return SupervisorService.instance;
    }

    public subscribe(callback: MessageCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
        };
    }

    public connect() {
        if (this.isConnected || this.socket) return;

        console.log("Supervisor Service: Connecting to " + this.URL);
        const ws = new WebSocket(this.URL);
        this.socket = ws;

        ws.onopen = () => {
            console.log("Supervisor Service: Connected.");
            this.isConnected = true;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.notify(data);
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };

        ws.onclose = (event) => {
            console.log(`Supervisor Service: Disconnected. Code: ${event.code}, Reason: ${event.reason}, WasClean: ${event.wasClean}`);
            this.isConnected = false;
            // Only clear if this specific socket is the one stored
            if (this.socket === ws) {
                this.socket = null;
            }
        };

        ws.onerror = (err) => {
            console.error("Supervisor Service Error:", err);
        };
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }

    public sendCommand(command: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(command));
        } else {
            console.warn("Socket not open. Cannot send command:", command);
        }
    }

    private notify(msg: SupervisorMessage) {
        this.listeners.forEach((cb) => cb(msg));
    }
}
