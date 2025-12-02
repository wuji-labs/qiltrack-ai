import { z } from "zod";

export const reportQuerySchema = z.object({
  query: z
    .string()
    .min(1, "请输入股票代码或名称")
    .max(50, "输入不能超过50个字符")
    .regex(/^[a-zA-Z0-9.\-\s]+$/, "只能包含字母、数字、点号和连字符"),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
