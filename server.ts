const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

import Surreal from "surrealdb.js";
import *  as Core from "./Database";
import { loadConfig, Config } from "./Config";
import { router } from './Router';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);

let config_file = 'config.cfg';

if (process.argv.length > 2) {
    config_file = process.argv[2];
}

if (!fs.existsSync(config_file)) {
    console.error('Config file not found!');
    process.exit(1);
}

if(!loadConfig(config_file)) {
    console.error('Error loading config file!');
    process.exit(1);
}


Core.Database.Connect(Config.db.host, Config.db.port, Config.db.username, Config.db.password).then((db) => {
    console.log('Connected to database!');
    app.listen(Config.port, Config.interface, () => {
        console.log(`Server listening on ${Config.interface}:${Config.port}`);
    });
}).catch((err) => {
    console.error('Error connecting to database!');
    console.error(err);
    process.exit(1);
});