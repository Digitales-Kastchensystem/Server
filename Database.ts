//import mysql 
import * as mysql from 'mysql2';
import { ApiLog, Log } from './Log';
import {TimeTableRoutine}  from './TimeTable';
import { Config, TimeTableConfig } from './Config';
import os from 'os';


export namespace Database {


    export let Connection:any = null;
    
    export namespace Routine {
        /**
         * Creates a JS object with the error message.
         *
         * @param {string} error - The first number.
         * @returns {object} Error object.
         */
        export function MkError(err: string, code: number = -1){
            return {
                error: err,
                code: code,
            };
        }

        /**
         * Creates a JS object with the info message.
         *  
         * @param {string} info - The first number.
         * @returns {object} Info object.
         */

        export function MkInfo(info: string){
            return {
                info: info,
            };
        }

        //make a timestamp in format YYYY-MM-DD HH:MM:SS
        export function MkTimestamp(){
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            return year + "/" + month + "/" + day + " um " + hours + ":" + minutes + ":" + seconds;
        }

    }

  

    export async function Connect(ip: string, port: number, user: string, pass: string, db: string) {
        const connection = await mysql.createConnection({
          host: ip,
          port: port,
          user: user,
          password: pass,
          database: db,
          waitForConnections: true, // Enable automatic reconnection
          connectionLimit: 32, // Adjust according to your needs
        });
      
        return connection;
      }

    //user schema: id	username	email	first_name	last_name	last_change	editable	colorful	type	class	password	token

    export namespace User{

        export async function GetByUsername(username: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM users WHERE username = ?', [username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
        }

        //get by email
        export async function GetByEmail(email: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM users WHERE email = ?', [email], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
        }

        //this function returns array of usernames of all users
        export async function GetAll() {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT username FROM users ORDER BY last_name ASC', (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        var usernames = [];
                        for (var i = 0; i < results.length; i++) {
                            usernames.push(results[i].username);
                        }
                        resolve(usernames);
                    }
                });
            });
        }

        export async function ChengeUserClass(username: string, class_title: string) {
            //set user class to class_title and if user is a student, set his timetable to new class timetable
            var user = await User.GetByUsername(username) as any;
            Connection.query('UPDATE users SET class = ? WHERE username = ?', [class_title, username], async (err:any, results:any) => {
                if (err) {
                    console.log(err);
                } else {
                    if (user.type == 'student') {
                        var StudentClass = await SchoolClass.GetByTitle(class_title) as any;
                        var old_timetable = await TimeTable.GetByOwner(username) as any;
                        await TimeTable.Update(username, JSON.stringify(old_timetable.timetable), StudentClass.ausgange, StudentClass.studien, old_timetable.class_sync);
                    }
                }
            });
        }


        //this function checks if user is a headmaster (klassenvorstand). if no, user is deleted. if yes, return an error. Delete timetale with owner = username, if exists
        export async function DeleteUser(username: string) {
            //get all classes with formteacher = username
            var schoolclass = await SchoolClass.GetByFormteacher(username) as any;
            //if not null, return error
            if (schoolclass != null) return Routine.MkError("User is a formteacher");
            //delete user
            await Delete(username);
            Connection.query('DELETE FROM timetable WHERE owner = ?', [username], (err:any, results:any) => {
                if (err) {
                    console.log(err);
                    return Routine.MkError("Error deleting timetable");
                } else {
                    return Routine.MkInfo("User deleted");
                }
            });
        }

        export async function GetByToken(token: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM users WHERE token = ?', [token], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            let user = results[0];
                            //if user has an empty token, return null
                            if (user.token == "" || user.token == null) {
                                resolve(null);
                            } else {
                                resolve(user);
                            }
                        }
                    }
                });
            });
        }


        //on creating a user, if user is a student, get the class, create a timetable for him and for timetable ausgange and studien get the class ausgange and studien
        export async function Create(username: string, email: string, first_name: string, last_name: string, last_change: string, editable: number, colorful: number, type: string, class_title: string, password: string) {
            if (type == 'student') {
                var StudentClass = await SchoolClass.GetByTitle(class_title) as any;
                var StudentTimeTable = await TimeTable.Create(username, JSON.stringify(TimeTableRoutine.MakeBlankTimeTable()), StudentClass.ausgange, StudentClass.studien, 0);
            }
            
            return new Promise((resolve, reject) => {
                Connection.query('INSERT INTO users (username, email, first_name, last_name, last_change, editable, colorful, type, class, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [username, email, first_name, last_name, "", editable, colorful, type, class_title, password], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results.insertId);
                    }
                });
            });
        }

        export async function Delete(username: string) {
            return new Promise((resolve, reject) => {
                Connection.query('DELETE FROM users WHERE username = ?', [username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        //update student information
        export async function Update(username: string, email: string, first_name: string, last_name: string, last_change: string, editable: string, colorful: string) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE users SET email = ?, first_name = ?, last_name = ?, last_change = ?, editable = ?, colorful = ? WHERE username = ?', [email, first_name, last_name, last_change, editable, colorful, username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }


        //enable user's timetable sync to 1 or 0
        export async function EnableSync(username: string, sync: boolean) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE timetable SET class_sync = ? WHERE owner = ?', [sync, username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

        //set user's timetable timetable row to json string
        export async function SetTimeTable(username: string, timetable: object) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE timetable SET timetable = ? WHERE owner = ?', [JSON.stringify(timetable), username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

        //update user's timetable timetable ausgange and studien
        export async function SetAusgangeStudien(username: string, ausgange: number, studien: number) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE timetable SET ausgange = ?, studien = ? WHERE owner = ?', [ausgange, studien, username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

        //update user's type. if type is student, get the class, create a timetable for him and for timetable ausgange and studien get the class ausgange and studien
        export async function SetType(username: string, type: string) {
            //get class by username
            var user = await User.GetByUsername(username) as any;
            var class_title = user.class;
            if (type == 'student') {
                var StudentClass = await SchoolClass.GetByTitle(class_title) as any;
                var StudentTimeTable = await TimeTable.Create(username, JSON.stringify(TimeTableRoutine.MakeBlankTimeTable()), StudentClass.ausgange, StudentClass.studien, 0);
            }
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE users SET type = ? WHERE username = ?', [type, username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

        //set user's password
        export async function SetPassword(username: string, password: string) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE users SET password = ? WHERE username = ?', [password, username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

        //set user's token
        export async function SetToken(username: string, token: string) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE users SET token = ? WHERE username = ?', [token, username], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

    }
    
    // class schema: 	id	owner	timetable(needs to be parsed, because this is a text containing json)	ausgange	studien	class_sync	
    export namespace TimeTable{
        //dont forget the json parse

        export async function GetByOwner(owner: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM timetable WHERE owner = ?', [owner], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                           //get result.timetable and parse it
                           var timetable = JSON.parse(results[0].timetable);
                           results[0].timetable = timetable;
                           resolve(results[0]);
                        }
                    }
                });
            });
        }

        //get raw timetable by user wich is a json string of 2d array
        export async function GetRawByOwner(owner: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT timetable FROM timetable WHERE owner = ?', [owner], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(JSON.parse(results[0].timetable));
                        }
                    }
                });
            });
        }

        export async function Create(owner: string, timetable: string, ausgange: string, studien: number, class_sync: number) {
            return new Promise((resolve, reject) => {
                Connection.query('INSERT INTO timetable (owner, timetable, ausgange, studien, class_sync) VALUES (?, ?, ?, ?, ?)', [owner, timetable, ausgange, studien, 1], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results.insertId);
                    }
                });
            });
        }

        export async function Update(owner: string, timetable: string, ausgange: string, studien: number, class_sync: number) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE timetable SET timetable = ?, ausgange = ?, studien = ?, class_sync = ? WHERE owner = ?', [timetable, ausgange, studien, class_sync, owner], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }

        export async function ToggleEditable(owner: string, editable: boolean) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE users SET editable = ? WHERE username = ?', [editable, owner], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        export async function UpdateAusgangeStudien(owner: string, ausgange: string, studien: number, consider_class_sync: boolean = false) {
            //if consider class sync is true, update only the timetable if class_sync is 1
            if (consider_class_sync) {
                return new Promise((resolve, reject) => {
                    Connection.query('UPDATE timetable SET ausgange = ?, studien = ? WHERE owner = ? AND class_sync = 1', [ausgange, studien, owner], (err:any, results:any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    });
                });
            }else{
                return new Promise((resolve, reject) => {
                    Connection.query('UPDATE timetable SET ausgange = ?, studien = ? WHERE owner = ?', [ausgange, studien, owner], (err:any, results:any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    }
                    );
                });
            }
        }

        //setup timetable for a user, it accepts username studien, ausgange and class_sync and editing
        export async function SetupTimetable(owner: string, studien: number, ausgange: number, class_sync: boolean, editing: boolean) {
            //convert boolean to number
            var ClassSync = 0;
            if (class_sync){
                ClassSync = 1;
                console.log("Class sync is true");
            }

            var Editing = 0;
            if (editing){
                Editing = 1;
                console.log("Editing is true");
            }

            //get users timtable
            var timetable = await TimeTable.GetByOwner(owner) as any;
            //syncroniously update users set editing = 1 where username = owner
            await Connection.query('UPDATE users SET editable = ? WHERE username = ?', [Editing, owner], (err:any, results:any) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Editing set to 1");
                }
            });

            //syncroniously update timetable set ausgange = ausgange, studien = studien, class_sync = class_sync where owner = owner
            await Connection.query('UPDATE timetable SET ausgange = ?, studien = ?, class_sync = ? WHERE owner = ?', [ausgange, studien, ClassSync, owner], (err:any, results:any) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Timetable updated");
                }
            });
            
        }

        //keep ausgange and studien and class sync old values, only update timetable function
        export async function UpdateTimetable(owner: string, timetable: any[][]){
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE timetable SET timetable = ? WHERE owner = ?', [JSON.stringify(timetable), owner], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        //update the user itself, set last_change to current timestamp
                        Connection.query('UPDATE users SET last_change = ? WHERE username = ?', [Routine.MkTimestamp(), owner], (err:any, results:any) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(results);
                            }
                        });
                    }
                }
                );
            });
        }

    }

    //class schema: id	formteacher	title	ausgange	studien	editing

    export namespace SchoolClass{
        export async function GetByFormteacher(formteacher: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM classes WHERE formteacher = ?', [formteacher], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
        }

        export async function GetLastCreated() {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT title FROM classes ORDER BY id DESC LIMIT 1', (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0].title);
                        }
                    }
                });
            });
        }

        export async function GetByTitle(title: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM classes WHERE title = ?', [title], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
        }

        //get cll classes as array of class titles
        export async function GetAll() {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT title FROM classes', (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        var classes = [];

                        for (var i = 0; i < results.length; i++) {
                            classes.push(results[i].title);
                        }
                        resolve(classes);
                    }
                });
            });
        }


        //get class assigned to a student
        export async function GetByUser(username: string) {
            //get user by username
            var user = await User.GetByUsername(username) as any;
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM classes WHERE id = ?', [user.class_title], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
        }

        export async function Create(formteacher: string, title: string, ausgange: string, studien: number, editing: number) {
            return new Promise((resolve, reject) => {
                Connection.query('INSERT INTO classes (formteacher, title, ausgange, studien, editing) VALUES (?, ?, ?, ?, ?)', [formteacher, title, ausgange, studien, editing], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results.insertId);
                    }
                });
            });
        }

        //get all students from a class as array of usernames
        export async function GetStudents(class_title: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM users WHERE type = "student" AND class = ? ORDER BY last_name ASC', [class_title], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            var students = [];
                            for (var i = 0; i < results.length; i++) {
                                students.push(results[i].username);
                            }
                            resolve(students);
                        }
                    }
                });
            });
        }

        //setclassparameters go through all students and set their  ausgange and studien, if class_sync is 1
        export async function SetClassParameters(class_title: string, ausgange: number, studien: number) {
            //get all students from class
            var students = await GetStudents(class_title) as any;
            //go through all students and set their  ausgange and studien, if class_sync is 1
            for (var i = 0; i < students.length; i++) {
                var student = await User.GetByUsername(students[i]) as any;
                if (student.class_sync == 1) {
                    User.SetAusgangeStudien(student.username, ausgange, studien);
                }
            }
            //set class ausgange and studien
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE classes SET ausgange = ?, studien = ? WHERE title = ?', [ausgange, studien, class_title], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });

        }

        //Update function wich takes class, username of a new teacher and ausgange and studien and updates them
        export async function Update(class_title: string, formteacher: string, studien: number, ausgange: number, editing: boolean){

            //convert editing to number, if true 1
            var EditingClass = 0;
            if (editing)
                EditingClass = 1;

            let new_formteacher = await User.GetByUsername(formteacher) as any;
            //username: string, email: string, first_name: string, last_name: string, last_change: string, editable: string, colorful: string
            User.Update(new_formteacher.username, new_formteacher.email, new_formteacher.first_name, new_formteacher.last_name, new_formteacher.last_change, new_formteacher.editable, new_formteacher.colorful);
            //set class ausgange and studien
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE classes SET formteacher = ?, ausgange = ?, studien = ?, editing = ? WHERE title = ?', [formteacher, ausgange, studien, EditingClass, class_title], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });

        }

        //on Deleting schoolclass, go through all users with this class assigned and set their class to the last class created. if there is only one class left, dont delete it
        export async function Delete(class_title: string) {
            //get all users from class, not only students, but everyone. use sql query
            Connection.query('SELECT * FROM users WHERE class = ?', [class_title], (err:any, results:any) => {
                if (err) {
                    console.log(err);
                } else {
                    //get the number of classes
                    Connection.query('SELECT COUNT(*) FROM classes', (err:any, results:any) => {
                        if (err) {
                            console.log(err);
                        } else {
                            //if there is only one class left, dont delete it
                            if (results[0]['COUNT(*)'] == 1) {
                                console.log("There is only one class left, dont delete it");
                            } else {
                               //delete the class
                                 Connection.query('DELETE FROM classes WHERE title = ?', [class_title], (err:any, results:any) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        //get the latest class from the database
                                        Connection.query('SELECT * FROM classes ORDER BY id DESC LIMIT 1', (err:any, results:any) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                //go through all users and set their class to the last class created
                                                for (var i = 0; i < results.length; i++) {
                                                    Connection.query('UPDATE users SET class = ? WHERE class = ?', [results[0].title, class_title], (err:any, results:any) => {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            return Routine.MkInfo("Class deleted");
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }

    }

    export namespace Settings {
        
        export async function Get(setting: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM settings WHERE setting = ?', [setting], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length == 0) {
                            resolve(null);
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
        }

        export async function Set(setting: string, value: string) {
            return new Promise((resolve, reject) => {
                Connection.query('UPDATE settings SET value = ? WHERE setting = ?', [value, setting], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
                );
            });
        }
        
    }

    export namespace Serializer {

        export async function SerializeUserPreview(username: string) {
            let user = await User.GetByUsername(username) as any;
            let IsFormteacher = false;
            if (await SchoolClass.GetByFormteacher(user.username) != null)
                IsFormteacher = true;
            return {
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                type: user.type,
                class_title: user.class,
                is_formteacher: IsFormteacher,
            };
        }

        export async function SerializeClassPreview(sclass: string) {
            let schoolclass = await SchoolClass.GetByTitle(sclass) as any;
            if (schoolclass == null) return {};
            let students = await SchoolClass.GetStudents(sclass) as any;
            let formtecher_preview = {};
            try {
                formtecher_preview = await Serializer.SerializeUserPreview(schoolclass.formteacher) as any;
            } catch (e) {
            }
            return {
                title: schoolclass.title,
                formteacher: formtecher_preview,
                ausgange: schoolclass.ausgange,
                studien: schoolclass.studien,
                editing: schoolclass.editing,
                students: students
            };
        }


        export async function SerializeUserFull(username : string) {
            let user = await User.GetByUsername(username) as any;
            if (user == null) return {};
            let timetable = null;
            if (user.type == 'student') {
                timetable = await TimeTable.GetByOwner(user.username) as any;
            }
            let schoolclass = await SchoolClass.GetByTitle(user.class) as any;
            //check if GetClassNyFormteacher returns null
            let IsFormteacher = false;
            if (await SchoolClass.GetByFormteacher(user.username) != null)
                IsFormteacher = true;
            return {
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                last_change: user.last_change,
                editable: user.editable,
                colorful: user.colorful,
                type: user.type,
                class_title: user.class,
                timetable: timetable,
                schoolclass: schoolclass,
                token: user.token,
                is_formteacher: IsFormteacher,
            };
        }

        export async function SerializeUserPrevireFull(username : string) {
            let user = await User.GetByUsername(username) as any;
            let timetable = null;
            if (user.type == 'student') {
                timetable = await TimeTable.GetByOwner(user.username) as any;
            }
            let schoolclass = await SchoolClass.GetByTitle(user.class) as any;
            let IsFormteacher = false;
            if (await SchoolClass.GetByFormteacher(user.username) != null)
                IsFormteacher = true;
            return {
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                last_change: user.last_change,
                editable: user.editable,
                colorful: user.colorful,
                type: user.type,
                class_title: user.class,
                timetable: timetable,
                schoolclass: schoolclass,
                is_formteacher: IsFormteacher,
            };
        }

        export async function SerializeClassPreviewFull(sclass: string) {
            let schoolclass = await SchoolClass.GetByTitle(sclass) as any;
            let classStudentsList = await SchoolClass.GetStudents(sclass) as any;
            if (classStudentsList == null)
                classStudentsList = [];
            let students = [];
            console.log(classStudentsList);
            for (let i = 0; i < classStudentsList.length; i++)
                students.push(await Serializer.SerializeUserPreview(classStudentsList[i]));
            let formtecher_preview = await Serializer.SerializeUserPreview(schoolclass.formteacher) as any;
            return {
                title: schoolclass.title,
                formteacher: formtecher_preview,
                ausgange: schoolclass.ausgange,
                studien: schoolclass.studien,
                editing: schoolclass.editing,
                students: students
            };
        }

        export async function SerializeStudentTimeTable(username: string) {
            let user = await User.GetByUsername(username) as any;
            let timetable = await TimeTable.GetByOwner(user.username) as any;
            let schoolclass = await SchoolClass.GetByTitle(user.class) as any;
            //add property to timetable
            var TTStats = await TimeTableRoutine.CalculateTimeTableStats(username);
            timetable.Settings = {
                    Days: TimeTableConfig.Days,
                    Units: TimeTableConfig.Units,
                    Colours: {
                        Studium: TimeTableConfig.Studium,
                        Ausgang: TimeTableConfig.Ausgang,
                        OtherColours: TimeTableConfig.Colours,
                        IgnoreCapitalLetters: TimeTableConfig.IgnoreCapitalLetters,
                        IgnoreSpaces: TimeTableConfig.IgnoreSpaces,
                        IgnoreBracketsContent: TimeTableConfig.IgnoreBracketsContent,
                    }
            };
            timetable.Stats = TTStats;
            return {
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                last_change: user.last_change,
                editable: user.editable,
                colorful: user.colorful,
                type: user.type,
                class_title: user.class,
                timetable: timetable,
                schoolclass: schoolclass,
            };
        }


        //serializeTimeTableOfClass
        export async function SerializeTimeTableSettings(ClassName : string) {
            let schoolclass = await SchoolClass.GetByTitle(ClassName) as any;
            return {
                Days: TimeTableConfig.Days,
                Units: TimeTableConfig.Units,
                Colours: {
                    Studium: TimeTableConfig.Studium,
                    Ausgang: TimeTableConfig.Ausgang,
                    OtherColours: TimeTableConfig.Colours,
                    IgnoreCapitalLetters: TimeTableConfig.IgnoreCapitalLetters,
                    IgnoreSpaces: TimeTableConfig.IgnoreSpaces,
                    IgnoreBracketsContent: TimeTableConfig.IgnoreBracketsContent,
                },
                ClassSettings: {
                    Ausgange: schoolclass.ausgange,
                    Studien: schoolclass.studien,
                    Editing: schoolclass.editing,
                }
            };
        }

        export async function SerializeDailyTimeTable(classTitle: string, dayIndex: number) {
            let schoolclass = await SchoolClass.GetByTitle(classTitle) as any;
            let classStudentsList = await SchoolClass.GetStudents(classTitle) as any;
            if (classStudentsList == null)
                classStudentsList = [];
            let students = [];
            //go through all students and get their timetable
            for (let i = 0; i < classStudentsList.length; i++) {
                let student = await User.GetByUsername(classStudentsList[i]) as any;
                let timetable = await TimeTable.GetByOwner(student.username) as any;
                let day = timetable.timetable[dayIndex];
                let studentTimeTableEntry = {
                    username: student.username,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    timetable: day,
                    class_sync: timetable.class_sync,
                    editable: student.editable,
                };
                students.push(studentTimeTableEntry);
            }
            return {
                title: schoolclass.title,
                ausgange: schoolclass.ausgange,
                studien: schoolclass.studien,
                editing: schoolclass.editing,
                students: students,
                Units: TimeTableConfig.Units,
            };
        }




        export async function GetAllClasses() {
            let classes = await SchoolClass.GetAll() as any;
            let result = [];
            for (let i = 0; i < classes.length; i++) {
                result.push(await SerializeClassPreview(classes[i]));
            }
            return result;
        }

        export async function GetAllUsers() {
            let users = await User.GetAll() as any;
            let result = [];
            for (let i = 0; i < users.length; i++) {
                result.push(await SerializeUserPreview(users[i]));
            }
            return result;
        }



    }

    export async function Auth(username: string, password: string) {
        let user = await User.GetByUsername(username) as any;
        if (user == null) {
            return null;
        }
        if (user.password != password) {
            return null;
        }
        //if user has no token, create one
        if (user.token == "" || user.token == null) {
            var token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            User.SetToken(username, token);
        }

        return Serializer.SerializeUserFull(username);
    }

    export async function LogOut(token: string) {
        let user = await User.GetByToken(token) as any;
        if (user == null) {
            return null;
        }
        User.SetToken(user.username, "");
        console.log("User logged out");
        return Serializer.SerializeUserFull(user.username);
    }

    export async function AuthByToken(token: string) {
        let user = await User.GetByToken(token) as any;
        if (user == null) {
            return null;
        }
        return Serializer.SerializeUserFull(user.username);
    }

    export async function CountUsersByType(type: string) {
        return new Promise((resolve, reject) => {
            Connection.query('SELECT COUNT(*) FROM users WHERE type = ?', [type], (err:any, results:any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0]['COUNT(*)']);
                }
            });
        });
    }


    function getHostInfo() {
        return {
            platform: os.platform(),
            architecture: os.arch(),
            hostname: os.hostname(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpus: os.cpus(),
        };
    }

    function getProcessInfo() {
        const nodeVersion = process.version;

        // Get memory usage statistics
        const memoryUsage = process.memoryUsage();

        const runtimeInfo = {
            nodeVersion,
            memoryUsage,
        };

        return runtimeInfo;
    }



    
    //Calculate stats: total users, total classes, total students, total teachers,
    export async function CalculateStats() {
        var Users = await User.GetAll() as any;
        var Classes = await SchoolClass.GetAll() as any;
        var Students = await CountUsersByType('student') as any;
        var Teachers = await CountUsersByType('teacher') as any;
        var Admins = await CountUsersByType('admin') as any;
        return {
            users: Users.length,
            classes: Classes.length,
            students: Students.length,
            teachers: Teachers.length,
            admins: Admins.length,
            info: Config.info,
            host: getHostInfo(),
            process: getProcessInfo(),
        };
    }
    
}	