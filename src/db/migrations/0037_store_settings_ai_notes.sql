-- AI 設定頁：店主/經理寫給 AI 小幫手的店家備忘（公司資訊、政策、口吻偏好），
-- 後台 AI 對話與收件匣 AI 草擬每次都會帶入 system prompt。

ALTER TABLE "store_settings" ADD COLUMN "ai_notes" text;
