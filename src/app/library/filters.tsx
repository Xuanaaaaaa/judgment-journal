"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 哨兵值：代表「不筛选」。用 __all__ 避免与用户自建领域标签冲突。
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
    <div className="mb-4 flex flex-wrap gap-3">
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
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v ?? ALL)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
