import { PageHeader } from "@/components/page-header";

import { EntryView } from "./entry-view";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <PageHeader
        title="记录一条判断"
        description="自然语言写下判断，AI 帮你整理成结构化卡片；置信度由你自己填。"
      />
      <EntryView />
    </main>
  );
}
