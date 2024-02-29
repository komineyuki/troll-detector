import {
  OWGames,
  OWGamesEvents,
  OWHotkeys
} from "@overwolf/overwolf-api-ts";

import { AppWindow } from "../AppWindow";
import { kHotkeys, kWindowNames, kGamesFeatures } from "../consts";

import WindowState = overwolf.windows.WindowStateEx;
import { FirebaseInfo } from "../firebase";

const player_text = document.getElementById("player_text");

// The window displayed in-game while a game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
  private static _instance: InGame;
  private _gameEventsListener: OWGamesEvents;
  private _eventsLog: HTMLElement;
  private _infoLog: HTMLElement;

  private constructor() {
    super(kWindowNames.inGame);

    this._eventsLog = document.getElementById('eventsLog');
    this._infoLog = document.getElementById('infoLog');

    this.setToggleHotkeyBehavior();
    this.setToggleHotkeyText();
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public async run() {
    this.currWindow.minimize();
    const gameClassId = await this.getCurrentGameClassId();

    const gameFeatures = kGamesFeatures.get(gameClassId);

    if (gameFeatures && gameFeatures.length) {
      this._gameEventsListener = new OWGamesEvents(
        {
          onInfoUpdates: this.onInfoUpdates.bind(this),
          onNewEvents: this.onNewEvents.bind(this)
        },
        gameFeatures
      );

      this._gameEventsListener.start();
    }
  }

  private onInfoUpdates(info) {
    this.logLine(info);
  }

  // Special events will be highlighted in the event log
  private onNewEvents(e) {
    this.logLine(e);
  }

  // Displays the toggle minimize/restore hotkey in the window header
  private async setToggleHotkeyText() {
    const gameClassId = await this.getCurrentGameClassId();
    const hotkeyText = await OWHotkeys.getHotkeyText(kHotkeys.toggle, gameClassId);
    const hotkeyElem = document.getElementById('hotkey');
    hotkeyElem.textContent = hotkeyText;
  }

  // Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
  private async setToggleHotkeyBehavior() {
    const toggleInGameWindow = async (
      hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent
    ): Promise<void> => {
      console.log(`pressed hotkey for ${hotkeyResult.name}`);
      const inGameState = await this.getWindowState();

      if (inGameState.window_state === WindowState.NORMAL ||
        inGameState.window_state === WindowState.MAXIMIZED) {
        this.currWindow.minimize();
      } else if (inGameState.window_state === WindowState.MINIMIZED ||
        inGameState.window_state === WindowState.CLOSED) {
        this.currWindow.restore();
      }
    }

    OWHotkeys.onHotkeyDown(kHotkeys.toggle, toggleInGameWindow);
  }

  // Appends a new line to the specified log
  private logLine(data) {
    this.detectGameInfo(data);
    console.log("DATA: " + JSON.stringify(data));
  }

  private async getCurrentGameClassId(): Promise<number | null> {
    const info = await OWGames.getRunningGameInfo();

    return (info && info.isRunning && info.classId) ? info.classId : null;
  }


  private rosters;


  private selectCharaMode = false;
  private myName = "";

  private resetRosters(){
    console.log("resetRosters()");
    this.rosters = [];
    this.rosters = Array(5).fill(
    {
      rosterName: "",
      emptyName: true,
      reportedNum: 0,
      isMe: false
    });
  }

  private async detectGameInfo(data){
    try{
      if(data.hasOwnProperty("me") && data.hasOwnProperty("player_name")){
        console.log("updatedMe");
        this.myName = data["me"]["player_name"];
        return;
      }

      if(data.hasOwnProperty("game_info")){
        console.log("data hasownpro game_info");
        if(data["game_info"].hasOwnProperty("scene")){
          switch(data["game_info"]["scene"]){
            case "CharacterSelectPersistentLevel":
              this.resetRosters();
              this.selectCharaMode = true;
              break;
            default:
              this.selectCharaMode = false;
              break;
          }
          return;
        }

        
      }

      if(data.hasOwnProperty("match_info")){
        this.detectRoster(data);
        return;
      }
    }catch (e){
      alert(e);
    }
  }


  private async updateReportedNum(str:string, rosterNum:number){
    console.log("updateReportedNum()");
    var obj = JSON.parse(str);
    const tempName = obj["name"];
    const hashPos = tempName.indexOf("#");
    const resultName = tempName.slice(0, hashPos - 1) + tempName.slice(hashPos);
    const chara = obj["character"];
    const ret = {
      resultName: resultName,
      emptyName: resultName == "",
      chara: chara
    };
    if(ret.chara != ""){
      console.log("roster chara was not empty");
      return;
    }
    if(ret.emptyName){
      console.log("he was anonymous or something");
      return;
    }

    console.log("PlayerNm: " + ret.resultName + "<");
    const f = new FirebaseInfo();
    const isMe = this.myName == ret.resultName;
    const reportedNum = await f.getReportedCount(ret.resultName);
    this.rosters[rosterNum] = {
      rosterName: ret.resultName,
      emptyName: ret.emptyName,
      reportedNum: reportedNum,
      isMe: isMe
    };
    console.log("Name: " + ret.resultName + ", emptyName: " + ret.emptyName + ", reportedNum: " + reportedNum + ", isMe: " + isMe);

    var str = "";
    var count = 1;
    this.rosters.filter(roster => {
      if(!roster.emptyName){
        str += count + ". " + roster.rosterName + " " + roster.reportedNum + "<br>";
      }else{
        str += count + ". (Anonymous)<br>"
      }
      count++;
    });
    player_text.innerHTML = str;
  }

  private async detectRoster(data){
    console.log("detectRoster()");
    if(!this.selectCharaMode) return;

    console.log(JSON.stringify(data));
    if(data["match_info"].hasOwnProperty("roster_0")){
      var str = data["match_info"]["roster_0"].replace(/\\/g,"");
      await this.updateReportedNum(str, 0);
    }

    if(data["match_info"].hasOwnProperty("roster_1")){
      var str = data["match_info"]["roster_1"].replace(/\\/g,"");
      await this.updateReportedNum(str, 1);
    }

    if(data["match_info"].hasOwnProperty("roster_2")){
      var str = data["match_info"]["roster_2"].replace(/\\/g,"");
      await this.updateReportedNum(str, 2);
    }

    if(data["match_info"].hasOwnProperty("roster_3")){
      var str = data["match_info"]["roster_3"].replace(/\\/g,"");
      await this.updateReportedNum(str, 3);
    }

    if(data["match_info"].hasOwnProperty("roster_4")){
      var str = data["match_info"]["roster_4"].replace(/\\/g,"");
      await this.updateReportedNum(str, 4);
    }
  }
}

InGame.instance().run();
