const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("pa", {
  move: (dx, dy) => ipcRenderer.send("move", dx, dy),
  ignore: f => ipcRenderer.send("ignore", f),
  menu: () => ipcRenderer.send("menu"),
  readModel: () => ipcRenderer.invoke("model")
});
