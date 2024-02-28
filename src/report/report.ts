import { FirebaseInfo } from "../firebase";

async function sendReport(){
    var tName = document.getElementById("toxicplayername") as HTMLInputElement;
    var tStr = tName.value;
    var selectType = document.getElementById('selectType') as HTMLInputElement;
    var remarks = document.getElementById("remarks") as HTMLInputElement;

    if (tStr.length == 0){
        alert("Write Troll player ID");
        return;
    }

    if(tStr.indexOf('#') == -1){
        alert("Please enter a valid username.");
        return;
    }

    const words = tStr.split('#');
    if(words[0].length == 0 || words[1].length == 0 || words[1].length >= 6){
        alert("Please enter a valid username.");
        return;
    }
    var f = new FirebaseInfo();

    var already = await f.checkReported(tStr);
    if(already){
        alert("You have already reported him.");
        return;
    }

    var b = await f.sendReport({
        trollID: tStr,
        trollType: selectType.value,
        trollRemark: remarks.value
    });

    if(!b){
        alert("Some errors have occurred.");
        return;
    }

    alert("Thank you for your report!");
    tName.value = "";
    remarks.value = "";
}

export function initReport(){
    var button = document.getElementById("sendReportButton");
    button.addEventListener("click", sendReport);
}