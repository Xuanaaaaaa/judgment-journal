// electron-builder 的 extraResources 会过滤掉 node_modules，导致 standalone 跑不起来
// （server.js 找不到 next）。这里在打包后直接把整个 .next/standalone 原样拷进
// Resources/standalone，再对整个 .app 做 ad-hoc 重签（identity 设为 null 时
// electron-builder 不自签，Apple Silicon 上未签名无法启动）。
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

exports.default = async function afterPack(context) {
  const { appOutDir, packager } = context;
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  const src = path.join(packager.projectDir, ".next", "standalone");
  const dest = path.join(appPath, "Contents", "Resources", "standalone");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });

  // 整 bundle 重签（含新拷入的资源），否则签名不一致会被 Gatekeeper 拒启。
  execFileSync("codesign", ["--deep", "--force", "-s", "-", appPath], {
    stdio: "inherit",
  });
};
