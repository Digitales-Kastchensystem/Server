import { Router, Request, Response } from 'express';

export const router = Router();

import {Config, SerializeSchoolPerview } from "./Config";
import { Log, ApiLog } from './Log';
import * as Core from "./Database";
import { Mail } from './Mail';
import { rateLimit } from 'express-rate-limit'

// API Routes

const apiAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: 'draft-7', // draft-6: RateLimit-* headers; draft-7: combined RateLimit header
	legacyHeaders: false, // X-RateLimit-* headers
});

const apiMailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: 'draft-7', // draft-6: RateLimit-* headers; draft-7: combined RateLimit header
    legacyHeaders: false, // X-RateLimit-* headers
});

//on all /auth/* routes, use apiLimiter
router.use('/auth/*', apiAuthLimiter);
//on all /auth/sendreset
router.use('/auth/sendreset', apiMailLimiter);

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
            res.json(Core.Database.Routine.MkError('Benuztername oder Passwort falsch!', 512));
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
            console.error(err);
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting classes!"));
        console.error(err);
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
            console.error(err);
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting user!"));
        console.error(err);
    });
});

//POST /user/update
router.post('/user/update', async(req, res) => {
    ApiLog('/user/update', req.ip);
    let token = req.body.token;
    let user = req.body.user as any; // Use 'as any' assertion here
    Core.Database.User.GetByToken(token).then(async (foundUser: { type: string, username: string }) => {
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
        //if user.last_change or user.editable or user.colorful are not set, get user by username and set them to the old values
        var last_change = user.last_change;
        var editable = user.editable;
        var colorful = user.colorful;



        var OldUser = await Core.Database.User.GetByUsername(user.username) as any;
        if (!last_change) last_change = OldUser.last_change;
        if (!editable) editable = OldUser.editable;
        if (!colorful) colorful = OldUser.colorful;
        var OldUserClass = OldUser.class;
        if (user.class !== OldUserClass) await Core.Database.User.ChengeUserClass(user.username, user.class_title);
        Core.Database.User.Update(user.username, user.email, user.first_name, user.last_name, last_change, editable, colorful).then(async (result) => {
            //if user's type is changed, call functnio to change it
            if (OldUser.type !== user.type) await Core.Database.User.SetType(user.username, user.type);
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

//POST /user/update-password
router.post('/user/update-password', (req, res) => {
    ApiLog('/user/update-password', req.ip);
    let token = req.body.token;
    let username = req.body.username;
    let password = req.body.password;
    Core.Database.User.GetByToken(token).then((foundUser: { type: string, username: string }) => {
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to update, return error
        if (foundUser.type !== "admin" && foundUser.username !== username) {
            res.json(Core.Database.Routine.MkError("You are not authorized to update this user!", 401));
            return;
        }
        //if password is not set, return error
        if (!password) {
            res.json(Core.Database.Routine.MkError("Password is not set!", 401));
            return;
        }
        Core.Database.User.SetPassword(username, password).then((result) => {
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

//POST /class/get
router.post('/class/get', (req, res) => {
    ApiLog('/class/get', req.ip);
    let token = req.body.token;
    let title = req.body.class_title;
    Core.Database.User.GetByToken(token).then((user : { type: string, username: string, class: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to get, return error
        if (user.type !== "admin" && user.type !== "teacher" && user.class !== title) {
            res.json(Core.Database.Routine.MkError("You are not authorized to get this class!", 401));
            return;
        }
        Core.Database.Serializer.SerializeClassPreviewFull(title).then((classData) => {
            if (!classData) {
                res.json(Core.Database.Routine.MkError("Class not found!", 401));
                return;
            }
            res.json(classData);
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while getting class!"));
            console.error(err);
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting class!"));
        console.error(err);
    });
});

//post /class/update update class.formteacher_username, class.StudyHours is class.studien and class.outings is class.ausgange
router.post('/class/update', (req, res) => {
    ApiLog('/class/update', req.ip);
    let token = req.body.token;
    let class_title = req.body.class.class_title;
    let formteacher_username = req.body.class.formteacher_username;
    let StudyHours = req.body.class.StudyHours;
    let outings = req.body.class.Outings;
    let editing = req.body.class.Editing;

    Core.Database.User.GetByToken(token).then((foundUser: { type: string, username: string }) => {
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to update, return error
        if (foundUser.type !== "admin" && foundUser.type !== "teacher") {
            res.json(Core.Database.Routine.MkError("You are not authorized to update this class!", 401));
            return;
        }
        //if class_title is not set, return error
        if (!class_title) {
            res.json(Core.Database.Routine.MkError("Class title is not set!", 401));
            return;
        }

        console.log(req.body);

        //if user is teacher, check, if the new formteacher of the class is the old formteacher. if not, return error
        if (foundUser.type === "teacher") {
            Core.Database.SchoolClass.GetByTitle(class_title).then((foundClass: { formteacher_username: string }) => {
                if (foundClass.formteacher_username !== foundUser.username) {
                    res.json(Core.Database.Routine.MkError("You are not authorized to update this class!", 401));
                    return;
                }
            }).catch((err) => {
                console.error(err);
                res.json(Core.Database.Routine.MkError("An error occurred while updating class!"));
            });
        }

        Core.Database.SchoolClass.Update(class_title, formteacher_username, StudyHours, outings, editing).then(async (result) => {
            let ClassStudents = await Core.Database.SchoolClass.GetStudents(class_title) as any[];
            for (let i = 0; i < ClassStudents.length; i++) {
                await Core.Database.TimeTable.UpdateAusgangeStudien(ClassStudents[i], outings, StudyHours, true);
                await Core.Database.TimeTable.ToggleEditable(ClassStudents[i], editing);
            }
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while updating class!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while updating class!"));
    });
});


//POST /user/timetable/get
router.post('/user/timetable/get', (req, res) => {
    ApiLog('/user/timetable/get', req.ip);
    let token = req.body.token;
    let username = req.body.username;
    Core.Database.User.GetByToken(token).then((user : { type: string, username: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to get, return error
        if (user.type !== "admin" && user.type !== "teacher" && user.username !== username) {
            res.json(Core.Database.Routine.MkError("You are not authorized to get this user's timetable!", 401));
            return;
        }
        Core.Database.Serializer.SerializeStudentTimeTable(username).then((timetable) => {
            if (!timetable) {
                res.json(Core.Database.Routine.MkError("User not found!", 401));
                return;
            }
            res.json(timetable);
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while getting user's timetable!"));
            console.error(err);
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting user's timetable!"));
        console.error(err);
    });
});

//POST /user/timetable/edit
//accepts dayindex, unitindex, username and new value
//admin and teacher can edit all, student can edit only his own timetabl if editing is enabled
router.post('/user/timetable/edit', (req, res) => {
    let token = req.body.token;
    let dayindex = req.body.dayindex;
    let unitindex = req.body.unitindex;
    let username = req.body.username;
    let value = req.body.value;

    //console.log(req.body);
    
    //return;
    ApiLog('/user/timetable/edit', req.ip);
    
    //get raw timtable and print it
    //Core.Database.TimeTable.GetRawByOwner

    Core.Database.User.GetByToken(token).then((user : { type: string, username: string, editable: number }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to get, return error
        if (user.type !== "admin" && user.type !== "teacher" && user.username !== username) {
            res.json(Core.Database.Routine.MkError("You are not authorized to edit this user's timetable!", 401));
            return;
        }

        //editing should be enabled if user is a student and edits his own timetable
        if (user.type === "student" && user.username === username) {
            if (user.editable == 0) {
                res.json(Core.Database.Routine.MkError("You are not authorized to edit this user's timetable!", 401));
                return;
            }
        }
        
        Core.Database.TimeTable.GetRawByOwner(username).then((timetable: any[][]) => {
            if (!timetable) {
                res.json(Core.Database.Routine.MkError("User not found!", 401));
                return;
            }

            timetable[dayindex][unitindex] = value;

            Core.Database.TimeTable.UpdateTimetable(username, timetable).then((result) => {
                res.json(result);
            }).catch((err) => {
                res.json(Core.Database.Routine.MkError("An error occured while editing user's timetable!"));
                console.error(err);
            });
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while editing user's timetable!"));
            console.error(err);
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while editing user's timetable!"));
        console.error(err);
    });
    
});

//POST /user/delete Only admin can delete users
router.post('/user/delete', (req, res) => {
    ApiLog('/user/delete', req.ip);
    let token = req.body.token;
    let username = req.body.username;
    Core.Database.User.GetByToken(token).then((foundUser: { type: string, username: string }) => {
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin, return error
        console.log(foundUser);
        if (foundUser.type !== "admin") {
            res.json(Core.Database.Routine.MkError("You are not authorized to delete users!", 401));
            return;
        }
        //if username is not set, return error
        if (!username) {
            res.json(Core.Database.Routine.MkError("Username is not set!", 401));
            return;
        }
        Core.Database.User.DeleteUser(username).then((result) => {
            res.json({});
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while deleting user!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while deleting user!"));
    });
});


//POST /class/delete Only admin can delete classes
router.post('/class/delete', (req, res) => {
    ApiLog('/class/delete', req.ip);
    let token = req.body.token;
    let class_title = req.body.class_title;
    Core.Database.User.GetByToken(token).then((foundUser: { type: string, username: string }) => {
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin, return error
        if (foundUser.type !== "admin") {
            res.json(Core.Database.Routine.MkError("You are not authorized to delete classes!", 401));
            return;
        }
        //if class_title is not set, return error
        if (!class_title) {
            res.json(Core.Database.Routine.MkError("Class title is not set!", 401));
            return;
        }
        Core.Database.SchoolClass.Delete(class_title).then((result) => {
            res.json({});
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while deleting class!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while deleting class!"));
    });
});

//POST /class/create Only admin can create classes
router.post('/class/create', (req, res) => {
    ApiLog('/class/create', req.ip);
    let token = req.body.token;
    let class_title = req.body.class.class_title;
    let formteacher_username = req.body.class.formteacher_username;
    let StudyHours = req.body.class.StudyHours;
    let outings = req.body.class.Outings;
    let editing = 0;
    Core.Database.User.GetByToken(token).then((foundUser: { type: string, username: string }) => {
        if (!foundUser) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin, return error
        if (foundUser.type !== "admin") {
            res.json(Core.Database.Routine.MkError("You are not authorized to create classes!", 401));
            return;
        }
        //if class_title is not set, return error
        if (!class_title || !formteacher_username || !StudyHours || !outings) {
            res.json(Core.Database.Routine.MkError("Not all fields are filled!", 401));
            console.log(class_title, formteacher_username, StudyHours, outings);
            return;
        }
        Core.Database.SchoolClass.Create(formteacher_username, class_title, StudyHours, outings, editing).then(async (result) => {
            await Core.Database.User.ChengeUserClass(formteacher_username, class_title);
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while creating class!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while creating class!"));
    });
});

//POST /user/timetable/setup. this endpoint sets user editing, studien and ausgange and clas sync
router.post('/user/timetable/setup', (req, res) => {
    ApiLog('/user/timetable/setup', req.ip);
    let token = req.body.token;
    let username = req.body.username;
    let editing = req.body.editing;
    let studien = req.body.studien;
    let ausgange = req.body.outings;
    let class_sync = req.body.class_sync;

    Core.Database.User.GetByToken(token).then((user : { type: string, username: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        //if user is not admin and teacher and is not the user he is trying to get, return error
        if (user.type !== "admin" && user.type !== "teacher") {
            res.json(Core.Database.Routine.MkError("You are not authorized to edit this user's timetable!", 401));
            return;
        }
        //if not all fields are filled, return error
        if (!username || !studien || !ausgange ||class_sync  === undefined || editing === undefined) {
            res.json(Core.Database.Routine.MkError("Not all fields are filled!", 401));
            return;
        }

        //export async function SetupTimetable(owner: string, studien: number, ausgange: number, class_sync: boolean, editing: boolean) {
        Core.Database.TimeTable.SetupTimetable(username, studien, ausgange, class_sync, editing).then((result) => {
            res.json({});
        }).catch((err) => {
            console.error(err);
            res.json(Core.Database.Routine.MkError("An error occurred while updating user's timetable!"));
        });
    }).catch((err) => {
        console.error(err);
        res.json(Core.Database.Routine.MkError("An error occurred while updating user's timetable!"));
    });
});


//POST /auth/logout
router.post('/auth/logout', (req, res) => {
    ApiLog('/auth/logout', req.ip);
    console.log(req.body);
    let token = req.body.token;
    Core.Database.User.GetByToken(token).then((user) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            console.error("Invalid token!");
            return;
        }
        Core.Database.LogOut(token).then((result) => {
            res.json(result);
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while logging out!"));
            console.error(err);
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while logging out!"));
        console.error(err);
    });
});

//POST /timetable/settings
router.post('/timetable/settings', (req, res) => {
    ApiLog('/timetable/settings', req.ip);
    let token = req.body.token;
    let schoolclass = req.body.class;
    //if username is teacher or admin, or username is a student of the class, return Database.Serializer.SerializeTimeTableSettings
    Core.Database.User.GetByToken(token).then((user : { type: string, username: string, class: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        Core.Database.Serializer.SerializeTimeTableSettings(schoolclass).then((settings) => {
            res.json(settings);
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while getting timetable settings!"));
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting timetable settings!"));
    });
});

//POST /timetable/DailyTimeTable
router.post('/timetable/DailyTimeTable', (req, res) => {
    let token = req.body.token;
    let dayindex = req.body.dayindex;
    let schoolclass = req.body.class;
    console.log(req.body);
    ApiLog('/timetable/DailyTimeTable', req.ip);
    //only admin and teacher can get timetable of a class
    Core.Database.User.GetByToken(token).then((user : { type: string, username: string, class: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Invalid token!", 401));
            return;
        }
        Core.Database.Serializer.SerializeDailyTimeTable(schoolclass, dayindex).then((day) => {
            res.json(day);
        }).catch((err) => {
            res.json(Core.Database.Routine.MkError("An error occured while getting timetable settings!"));
        });
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while getting timetable settings!"));
    });
});

//POST /auth/token
router.post('/auth/token', (req, res) => {
    ApiLog('/auth/token', req.ip);
    let token = req.body.token;
    Core.Database.AuthByToken(token).then((result) => {
        res.json(result);
    }).catch((err) => {
        res.json(Core.Database.Routine.MkError("An error occured while logging in!"));
    });
});

//POST /auth/sendreset
router.post('/auth/sendreset', (req, res) => {
    ApiLog('/auth/sendreset', req.ip);
    let username = req.body.username;
    Core.Database.User.GetByUsername(username).then((user : { username: string }) => {
        if (!user) {
            res.json(Core.Database.Routine.MkError("Dieser Benutzer existiert nicht!", 512));
            return;
        }
        Mail.SendResetEmail(user.username).then((result) => {
            res.json(result);
        }).catch((err) => {
            console.log(err);
            res.json(Core.Database.Routine.MkError("Ein Fehler ist aufgetreten! Bitte versuchen Sie es später erneut!"));
        });
    }).catch((err) => {
        console.log(err);
        res.json(Core.Database.Routine.MkError("Ein Fehler ist aufgetreten! Bitte versuchen Sie es später erneut!"));
    });
});

//POST /auth/reset
router.post('/auth/checkreset', (req, res) => {
    ApiLog('/auth/checkreset', req.ip);
    let username = req.body.username;
    let code = req.body.code;
    Mail.CheckReset(username, code).then((result:any) => {
        if (result) {
            res.json({});
        } else {
            res.json(Core.Database.Routine.MkError("Der Code ist ungültig!", 512));
        }
    }).catch((err:any) => {
        res.json(Core.Database.Routine.MkError("Der Code ist ungültig!", 512));
    });
});

//POST /auth/resetpassword
router.post('/auth/resetpassword', async(req, res) => {
    ApiLog('/auth/resetpassword', req.ip);
    let username = req.body.username;
    let code = req.body.code;
    let password = req.body.password;
    let isok = await Mail.CheckReset(username, code);
    if (!isok) {
        res.json(Core.Database.Routine.MkError("Der Code ist ungültig!", 512));
        return;
    }
    await Mail.UseReset(username, code);
    Core.Database.User.SetPassword(username, password).then((result) => {
        res.json(result);
    }).catch((err) => {
        console.log(err);
        res.json(Core.Database.Routine.MkError("Ein Fehler ist aufgetreten! Bitte versuchen Sie es später erneut!"));
    });
});