const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: "#f7f8fb",
    title: "GaemiGuard",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    window.loadURL(devServerUrl);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

