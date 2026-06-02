// 把领域状态映射成 Badge 的 variant。改色只动这里，不要散落到各页。

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "success";

export function typeBadgeVariant(type: string): BadgeVariant {
  return type === "prediction" ? "default" : "secondary";
}

export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "verified_correct":
      return "success";
    case "verified_wrong":
      return "destructive";
    case "pending":
    case "active":
      return "outline";
    case "expired":
    case "abandoned":
    case "withdrawn":
      return "secondary";
    default:
      return "outline";
  }
}
