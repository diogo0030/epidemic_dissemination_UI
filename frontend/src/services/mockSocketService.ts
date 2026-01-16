import scenario from "../mocks/scenario_1.json";
import type { SupervisorMessage } from "../core/types";

type MessageCallback = (msg: SupervisorMessage) => void;

export class MockSocketService {
    private static instance: MockSocketService;
    private listeners: MessageCallback[] = [];
    private isRunning = false;
    private timeouts: number[] = [];

    private constructor() { }

    public static getInstance(): MockSocketService {
        if (!MockSocketService.instance) {
            MockSocketService.instance = new MockSocketService();
        }
        return MockSocketService.instance;
    }

    public subscribe(callback: MessageCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
        };
    }

    public connect() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("Mock Socket: Connecting and starting scenario...");

        let accumulatedDelay = 0;

        // Cast seguro porque o JSON não tem tipos, mas sabemos que segue a estrutura
        const events = scenario as any[];

        events.forEach((event: any) => {
            // Se tiver delay explicito no evento, somamos o delay anterior
            // Se não, assumimos imediato (ou pequeno delay default)
            const delay = event.delay || 0;
            accumulatedDelay += delay;

            const timeoutId = window.setTimeout(() => {
                if (!this.isRunning) return;

                // Remover propriedade 'delay' antes de enviar para ficar igual ao real
                const { delay, ...realMessage } = event;
                this.notify(realMessage);
            }, accumulatedDelay);

            this.timeouts.push(timeoutId);
        });
    }

    public disconnect() {
        this.isRunning = false;
        this.timeouts.forEach((id) => clearTimeout(id));
        this.timeouts = [];
        console.log("Mock Socket: Disconnected.");
    }

    private notify(msg: SupervisorMessage) {
        console.log("Mock Socket Rcv:", msg);
        this.listeners.forEach((cb) => cb(msg));
    }
}
