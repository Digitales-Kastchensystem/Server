
const ConfigParser = require('configparser');
const fs = require('fs');

export var TimeTableConfig = {
    Days: Array<String>,
    Units: Array<String>,
    Studium: {
        Cells: Array<any>,
    },
    Ausgang: {
        Cells: Array<any>,
    },
    Colours: Array<any>,
    IgnoreBracketsContent: true,
    IgnoreCapitalLetters: true,
    IgnoreSpaces: true,
};

export var Config = {
    port: 3000,
    interface: '0.0.0.0',
    db: {
        host: '127.0.0.1',
        port: 8000,
        username: 'root',
        password: 'root',
        database: 'ks',
    },
    school:{
        title: 'School',
        html_title: 'school',
        url: 'www.yourschool.com',

        school_logo: 'school_logo.svg',

        admin_email: '',
    },
    settings: {
        allow_password_reset: true,
        allow_substitute_teacher: true,
        allow_substitute_teacher_edit: false,

        allow_teacher_view_all: true,
        allow_teacher_edit_all: false,
    },
    timetable: {
        days: Array<String>,
        timeUnits: 12,
    },
    log: {
        log_file: 'ks_server.log',
        log_format: '[%asctime] (%levelname) - %message',
    },
    mail:{
        path: '/usr/sbin/sendmail',
    },
    loaded: false,
};

function convertToBoolean(value: string): boolean {
    if (value == 'true') {
        return true;
    } else {
        return false;
    }
}

function LoadTTConfig() {
    //read file TimeTableConfig.json
    //load into TimeTableConfig

    TimeTableConfig = JSON.parse(fs.readFileSync('TimeTableConfig.json', 'utf8')).TimeTable;
}

export function loadConfig(filename: string) {
    try{
        const config = new ConfigParser();
        config.read(filename);

        Config.port = config.get('Server', 'port')*1;
        Config.interface = config.get('Server', 'interface');

        Config.db.host = config.get('Database', 'host');
        Config.db.port = config.get('Database', 'port')*1;
        Config.db.username = config.get('Database', 'username');
        Config.db.password = config.get('Database', 'password');
        Config.db.database = config.get('Database', 'database');

        Config.school.title = config.get('School', 'school_name');
        Config.school.html_title = config.get('School', 'school_web_name');
        Config.school.url = config.get('School', 'school_web_url');

        Config.school.school_logo = config.get('School', 'school_logo');

        Config.school.admin_email = config.get('School', 'admin_email');

        Config.settings.allow_password_reset = convertToBoolean(config.get('Security', 'allow_password_reset'));
        Config.settings.allow_substitute_teacher = convertToBoolean(config.get('Security', 'allow_substitute_teacher'));
        Config.settings.allow_substitute_teacher_edit = convertToBoolean(config.get('Security', 'allow_substitute_teacher_edit'));

        Config.settings.allow_teacher_view_all = convertToBoolean(config.get('Security', 'allow_teacher_view_all'));
        Config.settings.allow_teacher_edit_all = convertToBoolean(config.get('Security', 'allow_teacher_edit_all'));

        Config.log.log_file = config.get('Log', 'log_file');
        Config.log.log_format = config.get('Log', 'log_format');

        Config.mail.path = config.get('Mail', 'path');

        LoadTTConfig();

        Config.loaded = true;

        return true;
    } catch (e) {
        return false;
    }
}

export function SerializeSchoolPerview() {
    return {
        title: Config.school.title,
        html_title: Config.school.html_title,
        url: Config.school.url,
        school_logo: Config.school.school_logo,
        admin_email: Config.school.admin_email
    };
}