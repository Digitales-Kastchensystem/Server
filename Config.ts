
const ConfigParser = require('configparser');



export var Config = {
    port: 3000,
    interface: '0.0.0.0',
    db: {
        host: '127.0.0.1',
        port: 8000,
        username: 'root',
        password: 'root',
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
    log: {
        log_file: 'ks_server.log',
        log_format: '[%asctime] (%levelname) - %message',
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

        Config.loaded = true;

        return true;
    } catch (e) {
        return false;
    }
}