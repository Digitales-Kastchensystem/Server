import nodemailer from "nodemailer";
import { Config } from "./Config";
import { Log } from "./Log";
import { Database } from "./Database";
import sha256 from "sha256";

export namespace Mail{
    export let transporter: nodemailer.Transporter;

    export function Init(){
        try{
            transporter = nodemailer.createTransport({
                sendmail: true,
                newline: 'unix',
                path: Config.mail.path
            });
            return true;
        }catch(err){
            Log("Error initializing mail transporter: " + err, "ERROR");
            return false;
        }
    }

    export function SendMail(to: string, subject: string, html: string){
        transporter.sendMail({
            from: Config.school.admin_email,
            to: to,
            subject: subject,
            html: html
        }, (err:any, info:any) => {
            if (err) {
                console.log(err);
                Log("Error sending email to " + to + ": " + err);
            } else {
                console.log(info);
                Log("Sent email to " + to + ": " + info);
            }
        });
    }

    export function GenNumber(length: number = 6) {
        var result = '';
        var characters = '0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    export async function GenTmpUsername(): Promise<string>{
        //last 6 digits of current time + 6 random digits
        var Username = "u" + Date.now().toString().slice(-6) + GenNumber();
        //check if username exists
        var User = await Database.User.GetByUsername(Username);
        if(User) return await GenTmpUsername();
        return Username;
    }

    export async function SendResetEmail(Username: string){
        let User = await Database.User.GetByUsername(Username) as any;
        if(!User) return;
        let Code = GenNumber() as string;
        let EmailData = GenRsetEmail(User, Code);
        await Database.Connection.query("INSERT INTO `resets` (`username`, `code`) VALUES (?, ?)", [Username, Code]);
        SendMail(User.email, "Passwort zurücksetzen", EmailData);
        Log("Sent password reset email to " + User.email + " with code " + Code);
    }

    function GenRsetEmail(User: any, Code: string){
        var EmailData = 
            `
            <div class="email">
                <div class="header">
                    <p>Digitales Kästchensystem</p>
                </div>
                <div class="lettercontent">
                    <h1>Passwort zurücksetzen</h1>
                    <p>Sehr geehrte:r ${User.firstname} ${User.lastname},</p>
                    <p>Wir haben Ihre Anfrage für die Wiederherstellung des Passworts erhalten. Hier ist Ihr einmaliger Wiederherstellungscode:</p>
                    <div class="code">${Code}</div>
                    <p>Bitte geben Sie diesen Code nicht an Dritte weiter.</p>
                    <p>Vielen Dank!</p>
                    <p>Wenn Sie Ihr Passwort nicht zurücksetzen wollten, ignorieren Sie diese E-Mail bitte, oder kontaktieren Sie uns unter ${Config.school.admin_email}.</p>
                </div>
                <div class="footer">
                    ©2021-2023 Maxim Dikov - <b>DIKOV</b>Software
                </div>
            </div>
            <style>
                .email {
                    width: 90%;
                    padding: 10px;
                }
        
                .header {
                    padding: 10px;
                    background-color: #666666;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    color: white;
                }
        
                .lettercontent {
                    margin-top: 45px;
                    font-family: 'Helvetica';
                    font-style: normal;
                    font-weight: 400;
                    font-size: 16px;
                    line-height: 1.5;
                    text-align: center;
                }
        
                .bold {
                    font-weight: 700;
                }
        
                .code {
                    font-size: 36px;
                    font-weight: bold;
                    color: #FF4600;
                    margin-top: 20px;
                }
        
                .warning {
                    margin-top: 20px;
                    color: red;
                }
        
                .footer {
                    text-align: center;
                    margin-top: 20px;
                }
            </style>
        `;
        return EmailData;
    }

    export async function CheckReset(username: string, code:string){
        return new Promise((resolve, reject) => {
            Database.Connection.query("SELECT * FROM resets WHERE username = ? AND code = ? AND used = 0", [username, code], (err:any, result:any) => {
                if(err) reject(err);
                if(result.length == 0) resolve(false);
                resolve(true);
            });
        });
    }

    export async function UseReset(username: string, code:string){
        return new Promise((resolve, reject) => {
            Database.Connection.query("UPDATE resets SET used = 1 WHERE username = ? AND code = ? AND used = 0", [username, code], (err:any, result:any) => {
                if(err) reject(err);
                if(result.length == 0) resolve(false);
                resolve(true);
            });
        });
    }

    export async function GenCreateTmpUserEmail(Username:string, Password:string){
        var EmailData =
        `
        <div class="email">
            <div class="header">
                <p>Digitales Kästchensystem</p>
            </div>
            <div class="lettercontent">
                <h1>Konto für Supplierlehrer:in erstellen</h1>
                <p>Auf Ihre Anfrage hin haben wir ein Konto für Sie erstellt.</p>
                <div class="login_data_wrapper">
                    <div class="login_data">
                        <p>Benutzername: ${Username}</p>
                    </div>
                    <div class="login_data">
                        <p>Passwort: ${Password}</p>
                    </div>
                </div>
                <p>Bitte geben Sie diese Daten nicht an Dritte weiter.</p>
                <p>Vielen Dank!</p>
                <p>Wenn Sie keine Anfrage gestellt haben, können Sie diese E-Mail ignorieren.</p>
            </div>
            <div class="footer">
                ©2021-2023 Maxim Dikov - <b>DIKOV</b>Software
            </div>
        </div>
        <style>
            .email {
                width: 90%;
                padding: 10px;
            }
    
            .header {
                padding: 10px;
                background-color: #666666;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                color: white;
            }
    
            .lettercontent {
                margin-top: 45px;
                font-family: 'Helvetica';
                font-style: normal;
                font-weight: 400;
                font-size: 16px;
                line-height: 1.5;
                text-align: center;
            }
    
            .bold {
                font-weight: 700;
            }
    
            .login_data {
                font-size: 24px;
                font-weight: bold;
                margin-top: 20px;
                color: #FF4600;
            }
    
    
            .warning {
                margin-top: 20px;
                color: red;
            }
    
            .footer {
                text-align: center;
                margin-top: 20px;
            }
        </style>
    `;
        return EmailData;
    
    }


    export async function CreateTmpUser(email:string){
        let Username = await GenTmpUsername();
        let Password = GenNumber(8);
        //if GetByEmail returns a user, return
        let User = await Database.User.GetByEmail(email);
        if(User){
            Log("Error creating tmp user: User already exists with email " + email, "ERROR");
            return Database.Routine.MkError("Der Benutzer mit dieser E-Mail-Adresse existiert bereits.");
        }
        //get the last class title
        let classtitle = await Database.SchoolClass.GetLastCreated() as string;
        await Database.User.Create(Username, email, Username, "Supplierlehrer:in", "", 0, 0, "teacher", classtitle, sha256(Password));
        let EmailData = await GenCreateTmpUserEmail(Username, Password);
        SendMail(email, "Konto für Supplierlehrer:in erstellen", EmailData);
        Log("Created tmp user " + Username + " with email " + email);
        return Database.Routine.MkInfo("Der Benutzer wurde erstellt. Bitte überprüfen Sie Ihre E-Mails.");
    }

}