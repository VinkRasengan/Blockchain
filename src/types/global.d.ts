// Global type definitions for MyCoin project

declare global {
  interface Window {
    require: any;
    process: any;
    __dirname: string;
    __filename: string;
  }
}

// Electron types
declare module 'electron' {
  export interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
  }

  export interface App {
    whenReady(): Promise<void>;
    quit(): void;
    on(event: string, listener: (...args: any[]) => void): void;
    requestSingleInstanceLock(): boolean;
  }

  export interface BrowserWindow {
    new (options?: any): BrowserWindow;
    loadFile(filePath: string): Promise<void>;
    webContents: WebContents;
    isMinimized(): boolean;
    restore(): void;
    focus(): void;
    getAllWindows(): BrowserWindow[];
  }

  export interface WebContents {
    openDevTools(): void;
    send(channel: string, ...args: any[]): void;
  }

  export interface IpcMain {
    handle(channel: string, listener: (event: any, ...args: any[]) => any): void;
  }

  export interface Menu {
    buildFromTemplate(template: any[]): Menu;
    setApplicationMenu(menu: Menu): void;
  }

  export const app: App;
  export const ipcMain: IpcMain;
  export const ipcRenderer: IpcRenderer;
  export const Menu: any;
}

// Node.js types
declare module 'crypto' {
  export function createHash(algorithm: string): any;
  export function createCipher(algorithm: string, password: string): any;
  export function createDecipher(algorithm: string, password: string): any;
  export function randomBytes(size: number): Buffer;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string): string;
}

declare module 'fs' {
  export function readFileSync(path: string, encoding?: string): string | Buffer;
  export function writeFileSync(path: string, data: string | Buffer): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: any): void;
}

// WebSocket types
declare module 'ws' {
  export default class WebSocket {
    constructor(url: string);
    on(event: string, listener: (...args: any[]) => void): void;
    send(data: string): void;
    close(): void;
    readyState: number;
    static OPEN: number;
    static CLOSED: number;
    static CONNECTING: number;
    static CLOSING: number;
  }

  export class Server {
    constructor(options: any);
    on(event: string, listener: (...args: any[]) => void): void;
    close(): void;
  }
}

// Express types
declare module 'express' {
  export interface Request {
    params: any;
    body: any;
    query: any;
  }

  export interface Response {
    json(obj: any): void;
    status(code: number): Response;
    send(data: any): void;
  }

  export interface Application {
    use(...args: any[]): void;
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void): void;
    listen(port: number, callback?: () => void): void;
  }

  export default function express(): Application;
}

declare module 'cors' {
  export default function cors(): any;
}

// Level DB types
declare module 'level' {
  export default class Level {
    constructor(location: string, options?: any);
    put(key: string, value: any): Promise<void>;
    get(key: string): Promise<any>;
    del(key: string): Promise<void>;
    close(): Promise<void>;
  }
}

// Elliptic types
declare module 'elliptic' {
  export class ec {
    constructor(curve: string);
    genKeyPair(): any;
    keyFromPrivate(privateKey: string): any;
    keyFromPublic(publicKey: string, encoding: string): any;
  }
}

export {};
