import Surreal from "surrealdb.js";


export namespace Database {

    let db: Surreal;

    let TimeUnitsPerDay = 10;
    
    export namespace Routine {
        /**
         * Creates a JS object with the error message.
         *
         * @param {string} error - The first number.
         * @returns {object} Error object.
         */
        export function MkError(err: string){
            return {
                error: err,
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

    export async function Connect(ip: string, port: number, username: string, password: string){
        try {
            db = new Surreal("http://" + ip + ":" + port+"/rpc");
            await db.signin({
                user: username,
                pass: password
            });
        } catch (err) {
            console.log(err);
            return Routine.MkError("Could not connect to database.");
        }
    }    


    export namespace Get{

        /**
         * Gets all the users in the database.
         *  
         * @returns {array[object]} Users object.
         * */
        export async function Users(){
            const users = await db.select("users");
            return users;
        }


        /**
         * Gets all the classes in the database.
         * 
         * @returns {array[object]} Classes object.
         * */
        export async function Classes(){
            const classes = await db.select("classes");
            return classes;
        }

        /**
         * Gets all the timetables in the database.
         *  
         * @returns {array[object]} Timetables object.
         * */
        export async function TimeTables(){
            const timeTables = await db.select("timetables");
            return timeTables;
        }

    }

    export namespace Request{

        export async function Class(classname: string){
            const classes = await db.select("classes:" + classname);
            return classes;
        }

        export async function User(username: string){
            const users = await db.select("users:" + username);
            return users;
        }

        export async function GetUserClass(username: string){
            const user = await User(username);
            const classname = user.class;
            const classes = await Class(classname);
            return classes;
        }

        export async function ClassStudents(classname: string){
            const classes = await Class(classname);
            const students = classes.students;
            return students;
        }

        export async function ClassHeadTeacher(classname: string){
            const classes = await Class(classname);
            const headteacher = classes.headteacher;
            return headteacher;
        }

        export async function ClassTeachers(classname: string){
            const teachers: any[] = await Query("SELECT * users WHERE class = $1 AND type = $2", [classname, "teacher"]);
            var teacherUsernames: string[] = [];
            for (let i = 0; i < teachers.length; i++){
                teacherUsernames.push(teachers[i].username);
            }
            return teacherUsernames;
        }

        export async function Timetable(username: string){
            const timetable = await db.select("timetables:" + username);
            return timetable;
        }

        export async function UserTimetable(username: string){
            const user = await User(username);
            const timetable = await Timetable(user.timetable);
            return timetable;
        }

        export async function Query(query: string, args: any){
            const result = await db.query(query, args);
            return result;
        }
    }

    export namespace Classes{

        export namespace Get{
                
                export async function Students(classname: string){
                    const students = await Request.ClassStudents(classname);
                    return students;
                }
    
                export async function HeadTeacher(classname: string){
                    const headteacher = await Request.ClassHeadTeacher(classname);
                    return headteacher;
                }
    
                export async function Teachers(classname: string){
                    const teachers = await Request.ClassTeachers(classname);
                    return teachers;
                }

                export async function Class(classname: string){
                    const classes = await Request.Class(classname);
                    return classes;
                }
        }

        export namespace Set{
            export async function HeadTeacher(classname: string, headteacher: string){
                if (headteacher == ""){
                    //set relation from class to headteacher to null
                    await db.change('classes:' + classname, {
                        headteacher: null,
                    });
                } else {
                    //set relation from class to headteacher
                    await db.change('classes:' + classname, {
                        headteacher: headteacher,
                    });
                    //set headteacher class to classname
                    User.Set.Class(headteacher, classname);
                }
            }

            export async function SetClassStudents(classname: string, students: string[]){
                //set relation from class to students
                await db.change('classes:' + classname, {
                    students: students,
                });
                //set students class to classname
                for (let i = 0; i < students.length; i++){
                    User.Set.Class(students[i], classname);
                }
            }

            export async function SetClassEdit(classname: string, edit: boolean){
                let students = await Get.Students(classname);
                for (let i = 0; i < students.length; i++){
                    User.Set.Edit(students[i], edit);
                }
            }

            export async function SetClassRules(classname: string, wpfs: number, studien: number, ausgange: number){
                let students = await Get.Students(classname);
                //loop through all students and if they have custom rules disabled, set them
                for (let i = 0; i < students.length; i++){
                    let student = await Request.User(students[i]);
                    if (!student.CustomRules){
                        User.Set.CustomRules(students[i], wpfs, studien, ausgange);
                    }
                }
            }            
        }

        export async function Create(classname: string, headteacher: string, WPFs: number, Studien: number, Ausgange: number){
            let record = await db.create('classes:' + classname, {
                Classname: classname,
        
                WPFs: WPFs,
                Studien: Studien,
                Ausgange: Ausgange,
        
                EditMode: false,
            });
        
            //set relation from class to headteacher
            await Set.HeadTeacher(classname, headteacher);
        
            //create array of students
            let students: string[] = [];
            //set relation from class to students
            await Set.SetClassStudents(classname, students);
        }

        export async function DeleteClass(classname: string){
            await db.delete('classes:' + classname);
        }

        export async function AddClassStudent(classname: string, student: string){
            console.log("AddClassStudent: " + classname + " " + student);
            //get class
            let classrecord = await Get.Class(classname);
        
            //get students
            let students = classrecord.students;
            //add student to students
            students.push(student);
            //set relation from class to students
            await db.change('classes:' + classname, {
                students: students,
            });
            //set student class to classname
            User.Set.Class(student, classname);
        }

        export async function RemoveClassStudent(classname: string, student: string){
            console.log("RemoveClassStudent: " + classname + " " + student);
            //get class
            let classrecord = await Get.Class(classname);
            //get students
            let students = classrecord.students;
            //remove student from students
            students = students.filter((e: any) => e !== student);
            //set relation from class to students
            await db.change('classes:' + classname, {
                students: students,
            });
            //set student class to null
            User.Set.Class(student, "");
        }


    }

    export namespace Timetable{
        export namespace Get{
            async function GetTimetable(username: string){
                const timetable = await Request.UserTimetable(username);
                return timetable;
            }
        }

        export namespace Set{
            export async function Timetable(username: string, timetable: string[][]){
                await db.change('timetables:' + username, {
                    TimeTable: timetable,
                });
            }

            async function Unit(username: string, day: number, unit: number, content: string){
                const timetable = await Request.UserTimetable(username);
                timetable.timetable[day][unit] = content;
                await Timetable(username, timetable.timetable);
            }
            
        }

        //Timetable functions
        export async function Create(username: string){
            //get user class
            const user = await Request.User(username);
            const uclass = await Request.Class(user.class);

            //create timetable, a 2d array of 5 days and 12 units
            let timetable: string[][] = [];

            let CustomRules = false;

            let WPFs = uclass.WPFs;
            let Studien = uclass.Studien;
            let Ausgange = uclass.Ausgange;


            for (let i = 0; i < 5; i++){
                timetable[i] = [];
                for (let j = 0; j < 12; j++){
                    timetable[i][j] = "";
                }
            }

            db.create('timetables:' + username, {
                TimeTable: timetable,
                CustomRules: CustomRules,
                WPFs: WPFs,
                Studien: Studien,
                Ausgange: Ausgange,

                EditMode: false,
            });

            //set relation from user to timetable
            await db.change('users:' + username, {
                timetable: username,
            });

            //set relation from timetable to user
            await db.change('timetables:' + username, {
                user: username,
            });

            return timetable;
        }
            
    }

    export namespace User{

        export namespace Get{
            export async function Timetable(username: string){
                const timetable = await Request.UserTimetable(username);
                return timetable;
            }
        }

        export namespace Set{
            export async function Timetable(username: string, timetable: string[][]){
                await db.change('timetables:' + username, {
                    TimeTable: timetable,
                });
            }

            export async function Edit(username: string, edit: boolean){
                await db.change('timetables:' + username, {
                    EditMode: edit,
                });
            }

            export async function CustomRulesEnabled(username: string, customrules: boolean){
                await db.change('timetables:' + username, {
                    CustomRules: customrules,
                });
            }

            export async function CustomRules(username: string, wpfs: number, studien: number, ausgange: number){
                //if user has custom rules enabled, set them
                let user = await Request.User(username);
                if (!user.CustomRules) return;
                await db.change('timetables:' + username, {
                    WPFs: wpfs,
                    Studien: studien,
                    Ausgange: ausgange,
                });
            }

            export async function Class(username: string, classname: string){
                if (classname == ""){
                    //set relation from user to class to null
                    await db.change('users:' + username, {
                        class: null,
                    });
                } else {
                    //set relation from user to class
                    await db.change('users:' + username, {
                        class: classname,
                    });
                }
            }
            
            export async function Password(username: string, password: string){
                await db.change('users:' + username, {
                    password: password,
                });
            }
            
            export async function Token(username: string, token: string){
                await db.change('users:' + username, {
                    token: token,
                });
            }
            
            export async function Online(username: string, online: boolean){
                await db.change('users:' + username, {
                    online: online,
                });
            }
            
            export async function Type(username: string, type: string){
                
                //if user is a student or teacher, check if class is set
                if (type == "student" || type == "teacher"){
                    let user = await Request.User(username);
                    if (user.class == null) return Routine.MkError("Klasse nicht angegeben");
                }

                await db.change('users:' + username, {
                    type: type,
                });

                //if user is now a student, check if timetable is set, if not, create one and set it
                if (type == "student"){
                    let user = await Request.User(username);
                    if (user.timetable == null){
                        await Database.Timetable.Create(username);
                    }
                }
            }

            export async function Surname(username: string, surname: string){
                await db.change('users:' + username, {
                    surname: surname,
                });
            }

            export async function Lastname(username: string, lastname: string){
                await db.change('users:' + username, {
                    lastname: lastname,
                });
            }

        }

        export async function Create(username: string, password: string, type: string, surname: string, lastname: string, uclass: string = ""){
            try {
                //if user already exists, return error
                let user = await Request.User(username);
                if (user != null) return Routine.MkError("Benutzer existiert bereits");
        
                //if user is a student or teacher, check if class is set
                if (type == "student" || type == "teacher"){
                    if (uclass == "") return Routine.MkError("Klasse nicht angegeben");
                }
        
        
                if (type == "student" || type == "teacher"){
                    let classes = await Request.Class(uclass);
                    if (classes == null) return Routine.MkError("Klasse existiert nicht");
                }
        
                let record = await db.create('users:' + username, {
                    Username: username,
                    Password: password,
                    Type: type,
                    Surname: surname,
                    Lastname: lastname,
        
                    Token: "",
                    Online: false,
                });
                
                Set.Class(uclass, username);
        
                if (type == "student"){
                    Timetable.Create(username);
                }
            } catch (error) {
                console.log(error);
                return Routine.MkError("Fehler beim Erstellen des Benutzers");
            }
        }

        export async function DeleteUser(username: string){
            try {
                //get user
                let user = await Request.User(username);
                if (user == null) return Routine.MkError("Benutzer existiert nicht");
        
                //if user is a student, delete timetable
                if (user.type == "student"){
                    await db.delete('timetables:' + username);
                }
        
                //delete user
                await db.delete('users:' + username);
            } catch (error) {
                console.log(error);
                return Routine.MkError("Fehler beim Löschen des Benutzers");
            }
        }

    }

    export namespace Serializer{

        export async function GetUserOverview(username: string){
            let user = await Request.User(username);
            if (user == null) return Routine.MkError("Benutzer existiert nicht");
            
            return {
                Username: user.Username,
                Type: user.Type,
                Surname: user.Surname,
                Lastname: user.Lastname,
                Class: user.Class,
            }
        }

        export async function GetStudentOverview(username: string){
            let user = await Request.User(username);
            if (user == null) return Routine.MkError("Benutzer existiert nicht");
            
            let timetable = await Request.Timetable(username);
            if (timetable == null) return Routine.MkError("Stundenplan existiert nicht");

            let classoverview = await GetClassOverview(user.Class);
            if (classoverview == null) return Routine.MkError("Klasse existiert nicht");

            return {
                Username: user.Username,
                Type: user.Type,
                Surname: user.Surname,
                Lastname: user.Lastname,
                Class: user.Class,

                Wpfs: timetable.WPFs,
                Studien: timetable.Studien,
                Ausgange: timetable.Ausgange,

                EditMode: timetable.EditMode,
                
                CustomRules: timetable.CustomRules,
            }
        }

        export async function GetTimeTableOverview(username: string){
            let user = await Request.User(username);
            if (user == null) return Routine.MkError("Benutzer existiert nicht");
            
            let timetable = await Request.Timetable(username);
            if (timetable == null) return Routine.MkError("Stundenplan existiert nicht");

            let classoverview = await GetClassOverview(user.Class);
            if (classoverview == null) return Routine.MkError("Klasse existiert nicht");

            return {
                Username: user.Username,
                Class: user.Class,

                Wpfs: timetable.WPFs,
                Studien: timetable.Studien,
                Ausgange: timetable.Ausgange,

                EditMode: timetable.EditMode,
                
                CustomRules: timetable.CustomRules,

                Timetable: timetable.Timetable,
            }
        }

        export async function GetClassOverview(classname: string){
            let rclass = await Request.Class(classname);
            if (rclass == null) return Routine.MkError("Klasse existiert nicht");
            
            //get overview of headteacher of class and count of class students
            let headteacher = await GetUserOverview(rclass.Headteacher);
            let students = await Request.ClassStudents(classname);
            let count = students.length;

            return {
                Classname: rclass.Classname,
                Headteacher: headteacher,
                Students: count,

                WPFs: rclass.WPFs,
                Studien: rclass.Studien,
                Ausgange: rclass.Ausgange,

                EditMode: rclass.EditMode,
            }
        }

        export async function GetClassExtendedOverview(classname: string){
            let rclass = await Request.Class(classname);
            if (rclass == null) return Routine.MkError("Klasse existiert nicht");
            
            //get overview of headteacher of class and count of class students
            let headteacher = await GetUserOverview(rclass.Headteacher);
            let students = await Request.ClassStudents(classname);
            let count = students.length;

            //get all students of class
            let studentsOverview = new Array<any>();
            for (let i = 0; i < students.length; i++) {
                let student = await GetStudentOverview(students[i]);
                studentsOverview.push(student);
            }

            //get all teachers assigned to class
            let teachers = await Request.ClassTeachers(classname);
            let teachersOverview = new Array<any>();
            for (let i = 0; i < teachers.length; i++) {
                let teacher = await GetUserOverview(teachers[i]);
                teachersOverview.push(teacher);
            }

            return {
                Classname: rclass.Classname,
                Headteacher: headteacher,
                Students: count,

                WPFs: rclass.WPFs,
                Studien: rclass.Studien,
                Ausgange: rclass.Ausgange,

                EditMode: rclass.EditMode,

                StudentsOverview: studentsOverview,
                TeachersOverview: teachersOverview,

            }
            
        }

        //this function gets a day and number of time uints and returns an array of students of specific class  with value for specified time unit on specified day and the next time unit, if it exists
        export async function GetClassTimetable(classname: string, day: number, timeunit: number){
            let rclass = await Request.Class(classname);
            if (rclass == null) return Routine.MkError("Klasse existiert nicht");

            let students = await Request.ClassStudents(classname);
            
            let StudentGrid = new Array<any>();
            for (let i = 0; i < students.length; i++) {
                let student = await Request.User(students[i]);
                let timetable = await Request.Timetable(student.Username);
                let value = timetable.Timetable[day][timeunit];
                var nextvalue = "-";
                if (timeunit < TimeUnitsPerDay - 1){
                    nextvalue = timetable.Timetable[day][timeunit + 1];
                }
                StudentGrid.push({
                    Username: student.Username,
                    Surname: student.Surname,
                    Lastname: student.Lastname,
                    Value: value,
                    NextValue: nextvalue,
                });
            }

            return StudentGrid;
        }

        //this function gets data of whole class by day and returns an array of students but every student has an array of values for every time unit of the day
        export async function GetClassTimetableByDay(classname: string, day: number){
            let rclass = await Request.Class(classname);
            if (rclass == null) return Routine.MkError("Klasse existiert nicht");

            let students = await Request.ClassStudents(classname);
            
            let StudentGrid = new Array<any>();
            for (let i = 0; i < students.length; i++) {
                let student = await Request.User(students[i]);
                let timetable = await Request.Timetable(student.Username);
                let values = timetable.Timetable[day];
                
                StudentGrid.push({
                    Username: student.Username,
                    Surname: student.Surname,
                    Lastname: student.Lastname,
                    Class: student.Class,
                    Values: values,
                });

            }

            return StudentGrid;
        }

        
        
    }
}	