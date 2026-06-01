// Electron 主进程：把 Next.js standalone 服务作为子进程拉起（用 Electron 自带的
// Node 运行，无需系统装 Node），再开一个原生窗口加载它。数据库仍是外部的 Docker
// Postgres，本进程不管它。
const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");

let serverProcess = null;
let mainWindow = null;
let startUrl = null;

// 找一个空闲端口，避免与本机其它服务（含上次残留）抢 3000。
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// 极简 .env 解析：只取 KEY=VALUE，去掉成对引号。打包后的 .env 不含密钥
// （密钥存数据库），仅 DATABASE_URL 等连接配置。
function loadEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

// 轮询直到 server 起来（或超时）。
function waitForServer(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Next 服务启动超时"));
        } else {
          setTimeout(tryOnce, 300);
        }
      });
    };
    tryOnce();
  });
}

async function startServer() {
  // 开发模式：直接用已在跑的 `next dev`（见 package.json 的 electron:dev）。
  if (!app.isPackaged) {
    return process.env.ELECTRON_START_URL || "http://localhost:3000";
  }
  // 打包模式：拉起 extraResources 里的 standalone server.js。
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");
  const port = await getFreePort();
  const env = {
    ...process.env,
    ...loadEnvFile(path.join(standaloneDir, ".env")),
    ELECTRON_RUN_AS_NODE: "1", // 让 Electron 二进制以纯 Node 方式运行 server.js
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
  };
  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env,
    detached: true, // 独立进程组，便于退出时整组回收（杀掉 server 派生的任何子进程）
  });
  serverProcess.stdout.on("data", (d) => console.log("[next]", d.toString().trim()));
  serverProcess.stderr.on("data", (d) => console.error("[next]", d.toString().trim()));

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url, 30_000);
  return url;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    title: "Judgment Journal",
    webPreferences: { contextIsolation: true },
  });
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(async () => {
  try {
    startUrl = await startServer();
  } catch (err) {
    console.error("启动失败：", err);
    app.quit();
    return;
  }
  createWindow();

  // macOS：点 Dock 图标且无窗口时重开窗口。
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 第二种关窗行为：在 macOS 上关掉窗口不退出，app 留在 Dock 后台待命，
// 等 ⌘Q 才真正退出。其它平台保持「关完即退」。
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 真正退出时清理 Next 子进程，避免孤儿进程占端口。detached 让它自成进程组，
// 用负 PID 杀掉整组（含 server 可能派生的子进程）。
function killServer() {
  if (!serverProcess || serverProcess.killed) return;
  try {
    process.kill(-serverProcess.pid, "SIGTERM");
  } catch {
    // 进程组已不存在则忽略
  }
  serverProcess = null;
}

app.on("before-quit", killServer);
// Electron 主进程自身退出（含异常路径）时兜底，确保不留孤儿。
process.on("exit", killServer);
