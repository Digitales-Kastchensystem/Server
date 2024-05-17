import { writeFileSync } from "fs";
import {Config} from "./Config";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { Config } from "./Config";


const now = new Date();

// log_format = [%asctime] (%levelname) - %message

export function Log(message: string, level: string = 'INFO') {
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const timestamp = `${seconds}:${minutes}:${hours}`;
    const logformat = Config.log.log_format.replace('%asctime', timestamp).replace('%levelname', level).replace('%message', message);
    console.log(logformat);

    // Create folder if not exists
    const logFolderPath = Config.log.log_file.substring(0, Config.log.log_file.lastIndexOf("/"));
    if (!existsSync(logFolderPath)) {
        mkdirSync(logFolderPath, { recursive: true });
    }

    // Create file if not exists
    if (!existsSync(Config.log.log_file)) {
        writeFileSync(Config.log.log_file, "");
    }

    writeFileSync(Config.log.log_file, logformat + '\n', { flag: 'a' });
}

export function Error(message: string){
    Log(message, 'ERROR');
}

export function ApiLog(request: string, ip: string){
    Log(`API Request: ${request} from ${ip}`);
}