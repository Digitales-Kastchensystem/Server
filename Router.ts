import { Router, Request, Response } from 'express';

export const router = Router();

import {Config } from "./Config";

export let ServerConfig = Config;

router.get('/', (req, res) => {
    res.json(ServerConfig);
});