const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

import Surreal from "surrealdb.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

import *  as Core from "./Database";

Core.Database.Connect("root", "root").then(() => {
    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
});
