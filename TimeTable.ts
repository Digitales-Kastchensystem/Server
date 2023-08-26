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
                tt[i].push("-");
            }
        }
        //wrap the timetable in a object
        return tt;
    }


    export async function CalculateTimeTableStats(username : string){
        //get the timetable
        var TimeTableRaw = await Core.Database.TimeTable.GetRawByOwner(username) as any[][];
        var TimeTable = await Core.Database.TimeTable.GetByOwner(username) as any;

        var Stats = {
            WeeklyStudien: 0,
            WeeklyAusgange: 0,
        }

        //loop through the timetable 
        for(var i = 0; i < TimeTableRaw.length; i++){
            for(var j = 0; j < TimeTableRaw[i].length; j++){
                //loop through timetablesettings.Studium
                for(var k = 0; k < TimeTableConfig.Studium.Cells.length; k++){
                    //go through ignore rules
                    let CellContent = TimeTableRaw[i][j];
                    // @ts-ignore
                    let CellConfig: any = TimeTableConfig.Studium.Cells[k];
                    //TimeTableConfig IgnoreBracketsContent, IgnoreCapitalLetters, IgnoreSpaces 
                    if(TimeTableConfig.IgnoreBracketsContent){
                        CellContent = CellContent.replace(/\([^)]*\)/g, '');
                        CellConfig = CellConfig.replace(/\([^)]*\)/g, '');
                    }
                    if(TimeTableConfig.IgnoreCapitalLetters){
                        CellContent = CellContent.toLowerCase();
                        CellConfig = CellConfig.toLowerCase();
                    }
                    if(TimeTableConfig.IgnoreSpaces){
                        CellContent = CellContent.replace(/\s/g, '');
                        CellConfig = CellConfig.replace(/\s/g, '');
                    }

                    //if the cell content matches the cell config
                    if(CellContent == CellConfig) Stats.WeeklyStudien++;

                }

                //loop through timetablesettings.Ausgang
                for(var k = 0; k < TimeTableConfig.Ausgang.Cells.length; k++){
                    //go through ignore rules
                    let CellContent = TimeTableRaw[i][j];
                    // @ts-ignore
                    let CellConfig: any = TimeTableConfig.Ausgang.Cells[k];
                    //TimeTableConfig IgnoreBracketsContent, IgnoreCapitalLetters, IgnoreSpaces 
                    if(TimeTableConfig.IgnoreBracketsContent){
                        CellContent = CellContent.replace(/\([^)]*\)/g, '');
                        CellConfig = CellConfig.replace(/\([^)]*\)/g, '');
                    }
                    if(TimeTableConfig.IgnoreCapitalLetters){
                        CellContent = CellContent.toLowerCase();
                        CellConfig = CellConfig.toLowerCase();
                    }
                    if(TimeTableConfig.IgnoreSpaces){
                        CellContent = CellContent.replace(/\s/g, '');
                        CellConfig = CellConfig.replace(/\s/g, '');
                    }

                    //if the cell content matches the cell config
                    if(CellContent == CellConfig) Stats.WeeklyAusgange++;

                }

            }
        }

        return Stats;

    }

}