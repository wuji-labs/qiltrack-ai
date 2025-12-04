export type ConsumeResult = {
  success: boolean;
  remaining_credits: number;
};

export async function consumeReportCredit(): Promise<ConsumeResult> {
  return { success: true, remaining_credits: 10 };
}

export async function writeReportAudit(): Promise<void> {
  return;
}
