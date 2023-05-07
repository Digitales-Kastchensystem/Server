import { Router, Request, Response } from 'express';

export const router = Router();

import {Config, SerializeSchoolPerview } from "./Config";
import { Log, ApiLog } from './Log';


// API Routes

//General School Info

// POST /api/school/info
router.post('/school/info', (req, res) => {
    ApiLog('/school/info', req.ip);
    res.json(SerializeSchoolPerview());
});

// GET /api/school/info
router.get('/school/info', (req, res) => {
    ApiLog('/school/info', req.ip);
    res.json(SerializeSchoolPerview());
});

// GET /api/school/logo
router.get('/school/logo', (req, res) => {
    ApiLog('/school/logo', req.ip);
    res.sendFile(__dirname + '/public/' + Config.school.school_logo);
});