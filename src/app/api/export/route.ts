import { exportData } from "@/lib/export";

// 导出全部判断 + 复审/验证记录为 JSON 附件下载。
export async function GET() {
  const data = await exportData();
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), ...data },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="judgment-journal-export.json"',
    },
  });
}
