import { AppWindow } from "../AppWindow";
import { kWindowNames } from "../consts";
import {FirebaseInfo} from "../firebase";
import { initReport } from "../report/report";

// The desktop window is the window displayed while game is not running.
// In our case, our desktop window has no logic - it only displays static data.
// Therefore, only the generic AppWindow class is called.
new AppWindow(kWindowNames.desktop);

function updateUID(uid){
    var elm = document.getElementById("testtest");
    elm.textContent = "UID: " + uid;
}

function init(){
    var firebaseInfo = new FirebaseInfo();
    firebaseInfo.login(updateUID);
}

init();
initReport();