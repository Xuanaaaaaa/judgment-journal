import { EntryView } from "./entry-view";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-1 text-2xl font-semibold">记录一条判断</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        自然语言写下判断，AI 帮你整理成结构化卡片；置信度由你自己填。
      </p>
      <EntryView />
    </main>
  );
}
