export type CampaignStatus = "Sắp tới" | "Đang diễn ra" | "Đã xong" | "Đã hủy";

export interface IExamCampaign {
  id?: number;
  name: string;
  campaignStatus: CampaignStatus;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  description: string;
  status?: boolean;
}

export interface IExamSchedule {
  id?: number;
  campaignId: number;
  organizationId: number;
  organizationName?: string;
  schoolClass: string;
  examDate: string; // Format: YYYY-MM-DD
  status?: boolean;
}
