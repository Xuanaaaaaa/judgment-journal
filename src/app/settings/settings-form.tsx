"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  saveSettingsAction,
  testConnectionAction,
  type ActionResult,
} from "./actions";

type Props = {
  initial: {
    provider: string;
    baseUrl: string;
    model: string;
    defaultReviewIntervalDays: number;
  };
  hasApiKey: boolean;
};

export function SettingsForm({ initial, hasApiKey }: Props) {
  const [saveState, saveFormAction, saving] = useActionState<
    ActionResult,
    FormData
  >(saveSettingsAction, null);
  const [provider, setProvider] = useState(initial.provider);
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<ActionResult>(null);

  function runTest() {
    setTestResult(null);
    startTest(async () => {
      setTestResult(await testConnectionAction());
    });
  }

  return (
    <form action={saveFormAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI 模型配置</CardTitle>
          <CardDescription>
            用于自然语言解析。当前仅接入 OpenAI 兼容厂商（如 DeepSeek）。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <input type="hidden" name="provider" value={provider} />
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v ?? "openai-compatible")}
            >
              <SelectTrigger id="provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai-compatible">
                  OpenAI 兼容（DeepSeek 等）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              name="baseUrl"
              defaultValue={initial.baseUrl}
              placeholder="https://api.deepseek.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">模型</Label>
            <Input
              id="model"
              name="model"
              defaultValue={initial.model}
              placeholder="deepseek-v4-flash"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder={
                hasApiKey ? "已保存（留空则不修改）" : "填写 API Key"
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>偏好</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="defaultReviewIntervalDays">
              默认复审周期（天）
            </Label>
            <Input
              id="defaultReviewIntervalDays"
              name="defaultReviewIntervalDays"
              type="number"
              min={1}
              defaultValue={initial.defaultReviewIntervalDays}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={runTest}
          disabled={testing}
        >
          {testing ? "测试中…" : "测试连接"}
        </Button>
      </div>

      {saveState && (
        <p
          className={
            saveState.ok ? "text-sm text-foreground" : "text-sm text-destructive"
          }
        >
          {saveState.message}
        </p>
      )}
      {testResult && (
        <p
          className={
            testResult.ok
              ? "text-sm text-foreground"
              : "text-sm text-destructive"
          }
        >
          {testResult.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        「测试连接」使用已保存的配置，请先保存再测试。
      </p>
    </form>
  );
}
