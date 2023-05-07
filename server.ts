const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

import Surreal from "surrealdb.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

import *  as Core from "./Database";
import { router } from './Router';

app.use('/', router);

