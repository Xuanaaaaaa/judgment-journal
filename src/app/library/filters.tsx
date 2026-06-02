"use client";

import { useRouter } from "next/navigation";
import { FilterX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

const TYPE_OPTIONS = [
  { value: "prediction", label: "预测" },
  { value: "stance", label: "认知立场" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "待验证" },
  { value: "verified_correct", label: "已验证·对" },
  { value: "verified_wrong", label: "已验证·错" },
  { value: "expired", label: "已过期" },
  { value: "withdrawn", label: "已撤回" },
  { value: "active", label: "进行中" },
  { value: "abandoned", label: "已放弃" },
];

type Props = {
  domains: string[];
  current: { type: string; status: string; domain: string };
};

export function Filters({ domains, current }: Props) {
  const router = useRouter();
  const hasFilter = !!(current.type || current.status || current.domain);

  function update(key: "type" | "status" | "domain", value: string) {
    const next = { ...current, [key]: value === ALL ? "" : value };
    const params = new URLSearchParams();
    if (next.type) params.set("type", next.type);
    if (next.status) params.set("status", next.status);
    if (next.domain) params.set("domain", next.domain);
    const qs = params.toString();
    router.push(qs ? `/library?${qs}` : "/library");
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <FilterSelect
        placeholder="全部类型"
        value={current.type}
        options={TYPE_OPTIONS}
        onChange={(v) => update("type", v)}
      />
      <FilterSelect
        placeholder="全部状态"
        value={current.status}
        options={STATUS_OPTIONS}
        onChange={(v) => update("status", v)}
      />
      <FilterSelect
        placeholder="全部领域"
        value={current.domain}
        options={domains.map((d) => ({ value: d, label: d }))}
        onChange={(v) => update("domain", v)}
      />
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/library")}
        >
          <FilterX className="h-3.5 w-3.5" />
          清除筛选
        </Button>
      )}
    </div>
  );
}

function FilterSelect({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  // base-ui 的 Select.Value 默认在选中时显示原始 value，需要用渲染函数把 value 映射成 label。
  // 同时把空状态显式映射为 placeholder（避免 __all__ 字面量泄漏）。
  const allOptions = [{ value: ALL, label: placeholder }, ...options];
  const displayValue = value || ALL;

  return (
    <Select value={displayValue} onValueChange={(v) => onChange(v ?? ALL)}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder={placeholder}>
          {(v) =>
            allOptions.find((o) => o.value === (v as string))?.label ??
            placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
