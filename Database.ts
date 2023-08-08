//import mysql 
import * as mysql from 'mysql';
import { ApiLog, Log } from './Log';


export namespace Database {


    export let Connection:any = null;
    let TimeUnitsPerDay = 10;
    
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

    }

    export async function Connect(ip:string, port:number, user:string, pass:string, db:string) {
        return new Promise((resolve, reject) => {
            const connection = mysql.createConnection({
                host: ip,
                port: port,
                user: user,
                password: pass,
                database: db,
            });
            connection.connect((err:any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
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

        //this function returns array of usernames of all users
        export async function GetAll() {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT username FROM users', (err:any, results:any) => {
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


        export async function GetByToken(token: string) {
            return new Promise((resolve, reject) => {
                Connection.query('SELECT * FROM users WHERE token = ?', [token], (err:any, results:any) => {
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

        //on creating a user, if user is a student, get the class, create a timetable for him and for timetable ausgange and studien get the class ausgange and studien
        export async function Create(username: string, email: string, first_name: string, last_name: string, last_change: string, editable: number, colorful: number, type: string, class_title: string, password: string) {
            if (type == 'student') {
                var StudentClass = await SchoolClass.GetByTitle(class_title) as any;
                var StudentTimeTable = await TimeTable.Create(username, JSON.stringify({}), StudentClass.ausgange, StudentClass.studien, 0);
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
                var StudentTimeTable = await TimeTable.Create(username, StudentClass.timetable, StudentClass.ausgange, StudentClass.studien, 0);
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
                Connection.query('SELECT * FROM classes WHERE owner = ?', [owner], (err:any, results:any) => {
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

        export async function Create(owner: string, timetable: string, ausgange: string, studien: number, class_sync: number) {
            return new Promise((resolve, reject) => {
                Connection.query('INSERT INTO timetable (owner, timetable, ausgange, studien, class_sync) VALUES (?, ?, ?, ?, ?)', [owner, timetable, ausgange, studien, class_sync], (err:any, results:any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results.insertId);
                    }
                });
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
                Connection.query('SELECT * FROM users WHERE class = ?', [class_title], (err:any, results:any) => {
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

    }

    export namespace Serializer {

        export async function SerializeUserPreview(username: string) {
            let user = await User.GetByUsername(username) as any;
            return {
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                type: user.type,
                class_title: user.class,
            };
        }

        export async function SerializeClassPreview(sclass: string) {
            let schoolclass = await SchoolClass.GetByTitle(sclass) as any;
            let students = await SchoolClass.GetStudents(sclass) as any;
            return {
                title: schoolclass.title,
                formteacher: schoolclass.formteacher,
                ausgange: schoolclass.ausgange,
                studien: schoolclass.studien,
                editing: schoolclass.editing,
                students: students
            };
        }


        export async function SerializeUserFull(username : string) {
            let user = await User.GetByUsername(username) as any;
            let timetable = null;
            if (user.type == 'student') {
                timetable = await TimeTable.GetByOwner(user.username) as any;
            }
            let schoolclass = await SchoolClass.GetByTitle(user.class) as any;
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
            };
        }

        export async function SerializeUserPrevireFull(username : string) {
            let user = await User.GetByUsername(username) as any;
            let timetable = null;
            if (user.type == 'student') {
                timetable = await TimeTable.GetByOwner(user.username) as any;
            }
            let schoolclass = await SchoolClass.GetByTitle(user.class) as any;
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
        if (user.token == null) {
            var token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            User.SetToken(username, token);
        }

        return Serializer.SerializeUserFull(username);
    }

    
    
}	