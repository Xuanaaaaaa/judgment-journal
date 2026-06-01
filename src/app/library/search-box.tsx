"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 语义搜索框：提交后用 ?q= 进入搜索模式（与筛选/浏览互斥，由服务端读取 q 决定）。
export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit() {
    const q = value.trim();
    router.push(q ? `/library?q=${encodeURIComponent(q)}` : "/library");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mb-4 flex gap-2"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="语义搜索：用自然语言描述你想找的判断"
      />
      <Button type="submit">搜索</Button>
      {initial && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setValue("");
            router.push("/library");
          }}
        >
          清除
        </Button>
      )}
    </form>
  );
}
