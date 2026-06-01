import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Judgment Journal</h1>
      <p className="text-muted-foreground">判断力训练工具 — 项目骨架已就绪</p>
      <Button>开始</Button>
    </main>
  );
}
