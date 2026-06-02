"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit() {
    const q = value.trim();
    router.push(q ? `/library?q=${encodeURIComponent(q)}` : "/library");
  }

  function clear() {
    setValue("");
    router.push("/library");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mb-4"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="语义搜索：用自然语言描述你想找的判断"
          className="pr-10 pl-9"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="清除"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}
