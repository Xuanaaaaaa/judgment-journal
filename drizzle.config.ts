import { defineConfig } from "drizzle-kit";

// drizzle-kit CLI 不经过 Next.js，需自行加载 .env（Node 内置，无额外依赖）
try {
  process.loadEnvFile(".env");
} catch {
  // .env 不存在时忽略，依赖外部已注入的环境变量
}

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
