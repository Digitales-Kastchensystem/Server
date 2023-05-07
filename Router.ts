import { Router, Request, Response } from 'express';

export const router = Router();

import {Config } from "./Config";
import { Log } from './Log';

router.get('/', (req, res) => {
    res.json(Config);
});