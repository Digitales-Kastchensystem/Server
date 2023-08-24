import {Config, SerializeSchoolPerview, TimeTableConfig} from './Config';
import { Log, ApiLog } from './Log';
import * as Core from "./Database";

export namespace TimeTableRoutine{

    export function MakeBlankTimeTable() : any[][]{
        //use TimeTableConfig to make a blank timetable
        //create a new 2d array
        var tt: any[][] = [];
        for(var i = 0; i < TimeTableConfig.Days.length; i++){
            //add a new array
            tt.push([]);
            //for each time unit
            for(var j = 0; j < TimeTableConfig.Units.length; j++){
                //add a new object
                tt[i].push(" ");
            }
        }
        //wrap the timetable in a object
        return tt;
    }

}