import { OWWindow } from "@overwolf/overwolf-api-ts";

// A base class for the app's foreground windows.
// Sets the modal and drag behaviors, which are shared accross the desktop and in-game windows.
export class AppWindow {
  protected currWindow: OWWindow;
  protected mainWindow: OWWindow;
  protected maximized: boolean = false;

  constructor(windowName) {
    this.mainWindow = new OWWindow('background');
    this.currWindow = new OWWindow(windowName);

    const closeButton = document.getElementById('closeButton');
    const maximizeButton = document.getElementById('maximizeButton');
    const minimizeButton = document.getElementById('minimizeButton');

    const header = document.getElementById('header');

    this.setDrag(header);

    if(closeButton != null)
    closeButton.addEventListener('click', () => {
      this.mainWindow.close();
    });

    if(minimizeButton != null)
    minimizeButton.addEventListener('click', () => {
      this.currWindow.minimize();
    });

  }

  public async getWindowState() {
    return await this.currWindow.getWindowState();
  }

  private async setDrag(elem) {
    this.currWindow.dragMove(elem);
  }
}
