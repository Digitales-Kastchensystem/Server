import {Config} from "./Config";

const now = new Date();

// log_format = [%asctime] (%levelname) - %message

export function Log(message: string, level: string = 'INFO') {
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const timestamp = `${seconds}:${minutes}:${hours}`;

    const logformat = Config.log.log_format.replace('%asctime', timestamp).replace('%levelname', level).replace('%message', message);

    console.log(logformat);
}

export function ApiLog(request: string, ip: string){
    Log(`API Request: ${request} from ${ip}`);
}