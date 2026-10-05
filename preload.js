const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("pa", {
  move: (dx, dy) => ipcRenderer.send("move", dx, dy),
  ignore: f => ipcRenderer.send("ignore", f),
  menu: () => ipcRenderer.send("menu"),
  readModel: () => ipcRenderer.invoke("model"),
  open: u => ipcRenderer.send("open", u),
  on: cb => ipcRenderer.on("cmd", (_e, k, v) => cb(k, v))
});
