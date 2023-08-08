import { Router, Request, Response } from 'express';

export const router = Router();

import {Config, SerializeSchoolPerview } from "./Config";
import { Log, ApiLog } from './Log';
import * as Core from "./Database";


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



//MAIN API ROUTES

// POST /auth/login
router.post('/auth/login', (req, res) => {
    ApiLog('/auth/login', req.ip);
    Core.Database.Auth(req.body.username, req.body.password).then((result) => {
        if (result) {
            res.json(result);
        } else {
            res.json(Core.Database.Routine.MkError('Invalid username or password!'));
        }
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while logging in!"));
    });
});

//POST /class/list
router.post('/class/list', (req, res) => {
    ApiLog('/class/list', req.ip);
    let token = req.body.token;
    Core.Database.User.GetByToken(token).then((user) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        Core.Database.Serializer.GetAllClasses().then((classes) => {
            res.json(classes);
        }
        ).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while getting classes!"));
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting classes!"));
    });
});

//POST /users/list
router.post('/users/list', (req, res) => {
    ApiLog('/users/list', req.ip);
    let token = req.body.token;
    Core.Database.User.GetByToken(token).then((user) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        Core.Database.Serializer.GetAllUsers().then((users) => {
            res.json(users);
        }
        ).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occured while getting users!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occured while getting users!"));
    });
});

//POST /users/create 
/*
export async function CreateUser(username, first_name, last_name, password, email, class_title, type) {
        return await POST(GetSchoolUrl()+"/users/create", {
            token: GetUserToken(),
            user: {
                username: username,
                first_name: first_name,
                last_name: last_name,
                password: password,
                email: email,
                class_title: class_title,
                type: type
            }
        });
    }

    Backednd function:
    Create(username: string, email: string, first_name: string, last_name: string, last_change: string, editable: number, colorful: string, type: string, class_title: string, password: string) {
*/

router.post('/users/create', (req, res) => {
    ApiLog('/users/create', req.ip);
    let token = req.body.token;
    let user = req.body.user as any; // Use 'as any' assertion here
    
    Core.Database.User.GetByToken(token).then((foundUser: { type: string }) => { // Explicitly define the type here
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }

        //if user is not admin, return error
        if (foundUser.type !== "admin") {
            res.json(Core.Database.Routine.MkError("You are not authorized to create users!", 401));
            return;
        }

        //if not all fields are filled, return error
        if (!user.username || !user.first_name || !user.last_name || !user.password || !user.email || !user.class_title || !user.type) {
            res.json(Core.Database.Routine.MkError("Not all fields are filled!", 401));
            return;
        }

        //if user already exists, return error
        Core.Database.User.GetByUsername(user.username).then((foundUser) => {
            if (foundUser) {
                res.json(Core.Database.Routine.MkError("User already exists!", 401));
                return;
            }
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while creating user!"));
        });

        Core.Database.User.Create(user.username, user.email, user.first_name, user.last_name, user.last_change, 0, 1, user.type, user.class_title, user.password).then((result) => {
            res.json(result);
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while creating user!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while creating user!"));
    });
});

//POST /user/get
router.post('/user/get', (req, res) => {
    ApiLog('/user/get', req.ip);
    let token = req.body.token;
    let username = req.body.username;
    Core.Database.User.GetByToken(token).then((user : { type: string, username: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to get, return error
        if (user.type !== "admin" && user.type !== "teacher" && user.username !== username) {
            res.json(Core.Database.Routine.MkError("You are not authorized to get this user!", 401));
            return;
        }
        Core.Database.Serializer.SerializeUserPrevireFull(username).then((user) => {
            if (!user) {
                res.json(Core.Database.Routine.MkError("User not found!", 401));
                return;
            }
            res.json(user);
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while getting user!"));
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting user!"));
    });
});

//POST /user/update
router.post('/user/update', (req, res) => {
    ApiLog('/user/update', req.ip);
    let token = req.body.token;
    let username = req.body.username;
    let user = req.body.user as any; // Use 'as any' assertion here
    Core.Database.User.GetByToken(token).then((foundUser: { type: string, username: string }) => {
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to update, return error
        if (foundUser.type !== "admin" ) {
            res.json(Core.Database.Routine.MkError("You are not authorized to update this user!", 401));
            return;
        }
        //if not all fields are filled, return error
        if (!user.username || !user.first_name || !user.last_name || !user.email || !user.class_title || !user.type) {
            res.json(Core.Database.Routine.MkError("Not all fields are filled!", 401));
            return;
        }
        // Update(username: string, email: string, first_name: string, last_name: string, last_change: string, editable: string, colorful: string) {
        Core.Database.User.Update(user.username, user.email, user.first_name, user.last_name, user.last_change, user.editable, user.colorful).then((result) => {
            res.json(result);
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while updating user!"));
        }); 
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while updating user!"));
    });
});
