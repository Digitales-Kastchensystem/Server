const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

import *  as Core from "./Database";
import { loadConfig, Config } from "./Config";
import { router } from './Router';
import { Log } from './Log';
import { Mail } from './Mail';

Log('Digitales Kästchensystem Server v3.4.8 (Cryptographically reinforced edition)');
Log('© 2021 - 2024 Dikov (Created by Maxim Dikov, designed by Nikolay Dikov)');
Log('Copying, modifying and redistributing this software with commercial purposes is strictly prohibited! (See LICENSE file for more information)');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);
app.set('trust proxy', true);

let config_file = 'config.cfg';

if (process.argv.length > 2) {
    config_file = process.argv[2];
}

Log(`Loading config file ${config_file}`);

if (!fs.existsSync(config_file)) {
    Log(`Config file ${config_file} does not exist!`, 'ERROR');
    process.exit(1);
}

if(!loadConfig(config_file)) {
    Log(`Error loading config file ${config_file}!`, 'ERROR');
    process.exit(1);
}
if(Mail.Init()) Log("Initialized mail transporter");


Core.Database.Connect(Config.db.host, Config.db.port, Config.db.username, Config.db.password, Config.db.database).then(async(db) => {
    Log('Connected to database');
    Core.Database.Connection = db;
    app.listen(Config.port, Config.interface, () => {
        Log(`Listening on ${Config.interface}:${Config.port}`); 
    });
}).catch((err) => {
    Log('Error connecting to database!', 'ERROR');
    console.error(err);
    process.exit(1);
});