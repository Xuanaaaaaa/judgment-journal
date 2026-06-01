// type / status 的中文展示标签，列表页与详情页共用。

export const TYPE_LABEL: Record<string, string> = {
  prediction: "预测",
  stance: "认知立场",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "待验证",
  verified_correct: "已验证·对",
  verified_wrong: "已验证·错",
  expired: "已过期",
  withdrawn: "已撤回",
  active: "进行中",
  abandoned: "已放弃",
};
