import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 打包桌面应用：产出自包含 server.js（含精简 node_modules），
  // 由 Electron 主进程用自带 Node 拉起，无需系统装 Node。
  output: "standalone",
};

export default nextConfig;
