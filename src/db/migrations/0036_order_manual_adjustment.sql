-- 後台「訂單金額調整」：付款前可調整運費 / 手動加收或折讓。
-- manual_adjustment 正數 = 加收（如超重運費補收）、負數 = 折讓。

ALTER TABLE "orders" ADD COLUMN "manual_adjustment" integer DEFAULT 0 NOT NULL;
