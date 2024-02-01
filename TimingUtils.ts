import { Database } from "./Database";
import { Log } from "./Log";

async function CheckClassStates(){

    let Classes = await Database.SchoolClass.GetAll() as any[];
    let TimeSettings = [];


    for(let i = 0; i < Classes.length; i++)
        TimeSettings.push(await Database.SchoolClass.GetTimeSettings(Classes[i]) as any);

    
    //get current time as mm:hh format
    let date = new Date();
    let current_time = date.getHours() + ":" + date.getMinutes();

    //get current day as number
    let current_day = date.getDay();
        
    for(let i = 0; i < TimeSettings.length; i++){

        let Class = await Database.SchoolClass.GetByTitle(Classes[i]) as any;
        
        let starttime = TimeSettings[i].enabletime;
        let endtime = TimeSettings[i].disabletime;

        let dayenabled = TimeSettings[i].enableday;
        let daydisabled = TimeSettings[i].disableday;
        
        if(starttime == current_time && dayenabled == current_day){
            Database.SchoolClass.SetEditing(Class.title, true);
            Log("Class " + Class.title + " is now enabled");
        }

        if(endtime == current_time && daydisabled == current_day){
            Database.SchoolClass.SetEditing(Class.title, false);
            Log("Class " + Class.title + " is now disabled");
        }

    }


}

export async function CheckClassStatesLoop(){
    CheckClassStates();
    setInterval(async () => {
        await CheckClassStates();
        Log("Updated classes according to time settings");
    }, 1000 * 60);

    Log("Started class state checking unit with server timestamp " + new Date().toLocaleString());

}