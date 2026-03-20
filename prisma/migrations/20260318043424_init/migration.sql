/*
  Warnings:

  - You are about to drop the column `BOOL_IS_EMAIL_VERIFIED` on the `CREDENTIALS` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_RESET_TOKEN_EXPIRY` on the `CREDENTIALS` table. All the data in the column will be lost.
  - You are about to drop the column `STR_EMAIL_VERIFY_TOKEN` on the `CREDENTIALS` table. All the data in the column will be lost.
  - You are about to drop the column `STR_PASSWORD` on the `CREDENTIALS` table. All the data in the column will be lost.
  - You are about to drop the column `STR_RESET_TOKEN` on the `CREDENTIALS` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_HAS_CUSTOM_CONTENT` on the `DOCUMENT` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_DELETED_AT` on the `DOCUMENT` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_TRASH_EXPIRES_AT` on the `DOCUMENT` table. All the data in the column will be lost.
  - You are about to drop the column `JSON_FORM_DATA` on the `DOCUMENT` table. All the data in the column will be lost.
  - You are about to drop the column `STR_DOCUMENT_TYPE` on the `DOCUMENT` table. All the data in the column will be lost.
  - You are about to drop the column `UID_CREATED_BY` on the `DOCUMENT` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_LEGAL_VALIDITY` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_REQUIRES_REGISTRATION` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.
  - You are about to drop the column `JSON_APPLICABLE_REGULATIONS` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.
  - You are about to drop the column `JSON_VARIABLE_FIELDS` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.
  - You are about to drop the column `STR_DOCUMENT_TYPE` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.
  - You are about to drop the column `UID_CREATED_BY` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.
  - You are about to drop the column `UID_CREATED_BY` on the `FIRM` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_INVITE_EXPIRES_AT` on the `FIRM_MEMBER` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_JOINED_AT` on the `FIRM_MEMBER` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_LAST_ACTIVE_AT` on the `FIRM_MEMBER` table. All the data in the column will be lost.
  - You are about to drop the column `STR_INVITE_EMAIL` on the `FIRM_MEMBER` table. All the data in the column will be lost.
  - You are about to drop the column `STR_INVITE_TOKEN` on the `FIRM_MEMBER` table. All the data in the column will be lost.
  - You are about to drop the column `STR_SPECIALTY` on the `FIRM_SPECIALTY` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_BILLING_PERIOD_END` on the `INVOICE` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_BILLING_PERIOD_START` on the `INVOICE` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_IS_ACTIVE_BRANCH` on the `LEGAL_BRANCH` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_IS_SYSTEM_BRANCH` on the `LEGAL_BRANCH` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_SORT_ORDER_BRANCH` on the `LEGAL_BRANCH` table. All the data in the column will be lost.
  - You are about to drop the column `JSON_ADDITIONAL_DATA` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_RESPONSE_TIME_MS` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_STATUS_CODE` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `STR_HTTP_METHOD` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `STR_IP_ADDRESS` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `STR_REQUEST_ID` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `STR_SESSION_ID` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `STR_USER_AGENT` on the `LOG` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_EMAIL_BILLING` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_EMAIL_DOCUMENT_SHARED` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_EMAIL_LEGAL_UPDATES` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_EMAIL_NEW_DOCUMENT` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_EMAIL_TEAM_INVITE` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_EMAIL_TEMPLATE_UPDATED` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_INAPP_BILLING` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_INAPP_DOCUMENT_SHARED` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_INAPP_NEW_DOCUMENT` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_INAPP_TEAM_ACTIVITY` on the `NOTIFICATION_PREFERENCES` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_IS_DEFAULT_PAYMENT` on the `PAYMENT_METHOD` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_EXPIRY_MONTH` on the `PAYMENT_METHOD` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_EXPIRY_YEAR` on the `PAYMENT_METHOD` table. All the data in the column will be lost.
  - You are about to drop the column `STR_EXTERNAL_ID_PAYMENT` on the `PAYMENT_METHOD` table. All the data in the column will be lost.
  - You are about to drop the column `STR_HOLDER_NAME` on the `PAYMENT_METHOD` table. All the data in the column will be lost.
  - You are about to drop the column `STR_LAST_FOUR` on the `PAYMENT_METHOD` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_EXPIRES_AT` on the `REFRESH_TOKEN` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_REVOKED_AT` on the `REFRESH_TOKEN` table. All the data in the column will be lost.
  - You are about to drop the column `STR_IP_ADDRESS` on the `REFRESH_TOKEN` table. All the data in the column will be lost.
  - You are about to drop the column `STR_TOKEN_HASH` on the `REFRESH_TOKEN` table. All the data in the column will be lost.
  - You are about to drop the column `STR_USER_AGENT` on the `REFRESH_TOKEN` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_LOGIN_NOTIFICATIONS` on the `SECURITY_SETTINGS` table. All the data in the column will be lost.
  - You are about to drop the column `BOOL_TWO_FACTOR_ENABLED` on the `SECURITY_SETTINGS` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_SESSION_TIMEOUT_MINS` on the `SECURITY_SETTINGS` table. All the data in the column will be lost.
  - You are about to drop the column `STR_TWO_FACTOR_METHOD` on the `SECURITY_SETTINGS` table. All the data in the column will be lost.
  - You are about to drop the column `STR_TWO_FACTOR_SECRET` on the `SECURITY_SETTINGS` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_CANCELLED_AT` on the `SUBSCRIPTION` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_END_DATE` on the `SUBSCRIPTION` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_START_DATE` on the `SUBSCRIPTION` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_TRIAL_ENDS_AT` on the `SUBSCRIPTION` table. All the data in the column will be lost.
  - You are about to drop the column `STR_BILLING_CYCLE` on the `SUBSCRIPTION` table. All the data in the column will be lost.
  - You are about to drop the column `JSON_FEATURES` on the `SUBSCRIPTION_PLAN` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_MAX_DOCUMENTS` on the `SUBSCRIPTION_PLAN` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_MAX_TEMPLATES` on the `SUBSCRIPTION_PLAN` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_MAX_USERS` on the `SUBSCRIPTION_PLAN` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_PRICE_ANNUALLY` on the `SUBSCRIPTION_PLAN` table. All the data in the column will be lost.
  - You are about to drop the column `NUM_PRICE_MONTHLY` on the `SUBSCRIPTION_PLAN` table. All the data in the column will be lost.
  - You are about to drop the column `DTM_LAST_LOGIN_AT` on the `USER` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[STR_GOOGLE_ID_CREDENTIALS]` on the table `CREDENTIALS` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[STR_MICROSOFT_ID_CREDENTIALS]` on the table `CREDENTIALS` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `STR_DOCUMENT_TYPE_DOCUMENT` to the `DOCUMENT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UID_CREATED_BY_DOCUMENT` to the `DOCUMENT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `STR_DOCUMENT_TYPE_TEMPLATE` to the `DOCUMENT_TEMPLATE` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UID_CREATED_BY_FIRM` to the `FIRM` table without a default value. This is not possible if the table is not empty.
  - Added the required column `STR_SPECIALTY_FIRM_SPECIALTY` to the `FIRM_SPECIALTY` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DTM_EXPIRES_AT_REFRESH_TOKEN` to the `REFRESH_TOKEN` table without a default value. This is not possible if the table is not empty.
  - Added the required column `STR_TOKEN_HASH_REFRESH_TOKEN` to the `REFRESH_TOKEN` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DTM_START_DATE_SUBSCRIPTION` to the `SUBSCRIPTION` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DOCUMENT" DROP CONSTRAINT "DOCUMENT_UID_CREATED_BY_fkey";

-- DropIndex
DROP INDEX "DOCUMENT_DTM_DELETED_AT_idx";

-- DropIndex
DROP INDEX "DOCUMENT_UID_CREATED_BY_idx";

-- DropIndex
DROP INDEX "DOCUMENT_TEMPLATE_STR_DOCUMENT_TYPE_idx";

-- DropIndex
DROP INDEX "FIRM_MEMBER_STR_INVITE_TOKEN_idx";

-- DropIndex
DROP INDEX "LEGAL_BRANCH_BOOL_IS_SYSTEM_BRANCH_idx";

-- DropIndex
DROP INDEX "REFRESH_TOKEN_STR_TOKEN_HASH_idx";

-- AlterTable
ALTER TABLE "CREDENTIALS" DROP COLUMN "BOOL_IS_EMAIL_VERIFIED",
DROP COLUMN "DTM_RESET_TOKEN_EXPIRY",
DROP COLUMN "STR_EMAIL_VERIFY_TOKEN",
DROP COLUMN "STR_PASSWORD",
DROP COLUMN "STR_RESET_TOKEN",
ADD COLUMN     "BOOL_IS_EMAIL_VERIFIED_CREDENTIALS" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "DTM_RESET_TOKEN_EXPIRY_CREDENTIALS" TIMESTAMP(3),
ADD COLUMN     "STR_EMAIL_VERIFY_TOKEN_CREDENTIALS" TEXT,
ADD COLUMN     "STR_GOOGLE_ID_CREDENTIALS" TEXT,
ADD COLUMN     "STR_MICROSOFT_ID_CREDENTIALS" TEXT,
ADD COLUMN     "STR_PASSWORD_CREDENTIALS" TEXT,
ADD COLUMN     "STR_RESET_TOKEN_CREDENTIALS" TEXT;

-- AlterTable
ALTER TABLE "DIGITAL_SIGNATURE" ADD COLUMN     "DTM_DELETED_AT_SIGNATURE" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DOCUMENT" DROP COLUMN "BOOL_HAS_CUSTOM_CONTENT",
DROP COLUMN "DTM_DELETED_AT",
DROP COLUMN "DTM_TRASH_EXPIRES_AT",
DROP COLUMN "JSON_FORM_DATA",
DROP COLUMN "STR_DOCUMENT_TYPE",
DROP COLUMN "UID_CREATED_BY",
ADD COLUMN     "BOOL_HAS_CUSTOM_CONTENT_DOCUMENT" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "DTM_DELETED_AT_DOCUMENT" TIMESTAMP(3),
ADD COLUMN     "DTM_TRASH_EXPIRES_AT_DOCUMENT" TIMESTAMP(3),
ADD COLUMN     "JSON_FORM_DATA_DOCUMENT" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "STR_DOCUMENT_TYPE_DOCUMENT" TEXT NOT NULL,
ADD COLUMN     "UID_CREATED_BY_DOCUMENT" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DOCUMENT_TEMPLATE" DROP COLUMN "BOOL_LEGAL_VALIDITY",
DROP COLUMN "BOOL_REQUIRES_REGISTRATION",
DROP COLUMN "JSON_APPLICABLE_REGULATIONS",
DROP COLUMN "JSON_VARIABLE_FIELDS",
DROP COLUMN "STR_DOCUMENT_TYPE",
DROP COLUMN "UID_CREATED_BY",
ADD COLUMN     "BOOL_LEGAL_VALIDITY_TEMPLATE" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_REQUIRES_REGISTRATION_TEMPLATE" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "DTM_DELETED_AT_TEMPLATE" TIMESTAMP(3),
ADD COLUMN     "JSON_APPLICABLE_REGULATIONS_TEMPLATE" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "JSON_VARIABLE_FIELDS_TEMPLATE" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "STR_DOCUMENT_TYPE_TEMPLATE" TEXT NOT NULL,
ADD COLUMN     "UID_CREATED_BY_TEMPLATE" TEXT;

-- AlterTable
ALTER TABLE "FIRM" DROP COLUMN "UID_CREATED_BY",
ADD COLUMN     "DTM_DELETED_AT_FIRM" TIMESTAMP(3),
ADD COLUMN     "UID_CREATED_BY_FIRM" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FIRM_MEMBER" DROP COLUMN "DTM_INVITE_EXPIRES_AT",
DROP COLUMN "DTM_JOINED_AT",
DROP COLUMN "DTM_LAST_ACTIVE_AT",
DROP COLUMN "STR_INVITE_EMAIL",
DROP COLUMN "STR_INVITE_TOKEN",
ADD COLUMN     "DTM_INVITE_EXPIRES_AT_FIRM_MEMBER" TIMESTAMP(3),
ADD COLUMN     "DTM_JOINED_AT_FIRM_MEMBER" TIMESTAMP(3),
ADD COLUMN     "DTM_LAST_ACTIVE_AT_FIRM_MEMBER" TIMESTAMP(3),
ADD COLUMN     "STR_INVITE_EMAIL_FIRM_MEMBER" TEXT,
ADD COLUMN     "STR_INVITE_TOKEN_FIRM_MEMBER" TEXT;

-- AlterTable
ALTER TABLE "FIRM_SPECIALTY" DROP COLUMN "STR_SPECIALTY",
ADD COLUMN     "STR_SPECIALTY_FIRM_SPECIALTY" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "INVOICE" DROP COLUMN "DTM_BILLING_PERIOD_END",
DROP COLUMN "DTM_BILLING_PERIOD_START",
ADD COLUMN     "DTM_BILLING_PERIOD_END_INVOICE" TIMESTAMP(3),
ADD COLUMN     "DTM_BILLING_PERIOD_START_INVOICE" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LEGAL_BRANCH" DROP COLUMN "BOOL_IS_ACTIVE_BRANCH",
DROP COLUMN "BOOL_IS_SYSTEM_BRANCH",
DROP COLUMN "NUM_SORT_ORDER_BRANCH",
ADD COLUMN     "BOOL_IS_ACTIVE_LEGAL_BRANCH" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_IS_SYSTEM_LEGAL_BRANCH" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "DTM_DELETED_AT_LEGAL_BRANCH" TIMESTAMP(3),
ADD COLUMN     "NUM_SORT_ORDER_LEGAL_BRANCH" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LOG" DROP COLUMN "JSON_ADDITIONAL_DATA",
DROP COLUMN "NUM_RESPONSE_TIME_MS",
DROP COLUMN "NUM_STATUS_CODE",
DROP COLUMN "STR_HTTP_METHOD",
DROP COLUMN "STR_IP_ADDRESS",
DROP COLUMN "STR_REQUEST_ID",
DROP COLUMN "STR_SESSION_ID",
DROP COLUMN "STR_USER_AGENT",
ADD COLUMN     "JSON_ADDITIONAL_DATA_LOG" JSONB,
ADD COLUMN     "NUM_RESPONSE_TIME_MS_LOG" INTEGER,
ADD COLUMN     "NUM_STATUS_CODE_LOG" INTEGER,
ADD COLUMN     "STR_HTTP_METHOD_LOG" TEXT,
ADD COLUMN     "STR_IP_ADDRESS_LOG" TEXT,
ADD COLUMN     "STR_REQUEST_ID_LOG" TEXT,
ADD COLUMN     "STR_SESSION_ID_LOG" TEXT,
ADD COLUMN     "STR_USER_AGENT_LOG" TEXT;

-- AlterTable
ALTER TABLE "NOTIFICATION_PREFERENCES" DROP COLUMN "BOOL_EMAIL_BILLING",
DROP COLUMN "BOOL_EMAIL_DOCUMENT_SHARED",
DROP COLUMN "BOOL_EMAIL_LEGAL_UPDATES",
DROP COLUMN "BOOL_EMAIL_NEW_DOCUMENT",
DROP COLUMN "BOOL_EMAIL_TEAM_INVITE",
DROP COLUMN "BOOL_EMAIL_TEMPLATE_UPDATED",
DROP COLUMN "BOOL_INAPP_BILLING",
DROP COLUMN "BOOL_INAPP_DOCUMENT_SHARED",
DROP COLUMN "BOOL_INAPP_NEW_DOCUMENT",
DROP COLUMN "BOOL_INAPP_TEAM_ACTIVITY",
ADD COLUMN     "BOOL_EMAIL_BILLING_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_EMAIL_DOCUMENT_SHARED_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_EMAIL_LEGAL_UPDATES_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "BOOL_EMAIL_NEW_DOCUMENT_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_EMAIL_TEAM_INVITE_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_EMAIL_TEMPLATE_UPDATED_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_INAPP_BILLING_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_INAPP_DOCUMENT_SHARED_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_INAPP_NEW_DOCUMENT_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_INAPP_TEAM_ACTIVITY_NOTIF_PREFS" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PAYMENT_METHOD" DROP COLUMN "BOOL_IS_DEFAULT_PAYMENT",
DROP COLUMN "NUM_EXPIRY_MONTH",
DROP COLUMN "NUM_EXPIRY_YEAR",
DROP COLUMN "STR_EXTERNAL_ID_PAYMENT",
DROP COLUMN "STR_HOLDER_NAME",
DROP COLUMN "STR_LAST_FOUR",
ADD COLUMN     "BOOL_IS_DEFAULT_PAYMENT_METHOD" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "NUM_EXPIRY_MONTH_PAYMENT_METHOD" INTEGER,
ADD COLUMN     "NUM_EXPIRY_YEAR_PAYMENT_METHOD" INTEGER,
ADD COLUMN     "STR_EXTERNAL_ID_PAYMENT_METHOD" TEXT,
ADD COLUMN     "STR_HOLDER_NAME_PAYMENT_METHOD" TEXT,
ADD COLUMN     "STR_LAST_FOUR_PAYMENT_METHOD" TEXT;

-- AlterTable
ALTER TABLE "REFRESH_TOKEN" DROP COLUMN "DTM_EXPIRES_AT",
DROP COLUMN "DTM_REVOKED_AT",
DROP COLUMN "STR_IP_ADDRESS",
DROP COLUMN "STR_TOKEN_HASH",
DROP COLUMN "STR_USER_AGENT",
ADD COLUMN     "DTM_EXPIRES_AT_REFRESH_TOKEN" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "DTM_REVOKED_AT_REFRESH_TOKEN" TIMESTAMP(3),
ADD COLUMN     "STR_IP_ADDRESS_REFRESH_TOKEN" TEXT,
ADD COLUMN     "STR_TOKEN_HASH_REFRESH_TOKEN" TEXT NOT NULL,
ADD COLUMN     "STR_USER_AGENT_REFRESH_TOKEN" TEXT;

-- AlterTable
ALTER TABLE "SECURITY_SETTINGS" DROP COLUMN "BOOL_LOGIN_NOTIFICATIONS",
DROP COLUMN "BOOL_TWO_FACTOR_ENABLED",
DROP COLUMN "NUM_SESSION_TIMEOUT_MINS",
DROP COLUMN "STR_TWO_FACTOR_METHOD",
DROP COLUMN "STR_TWO_FACTOR_SECRET",
ADD COLUMN     "BOOL_LOGIN_NOTIFICATIONS_SECURITY_SETTINGS" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "BOOL_TWO_FACTOR_ENABLED_SECURITY_SETTINGS" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "NUM_SESSION_TIMEOUT_MINS_SECURITY_SETTINGS" INTEGER NOT NULL DEFAULT 480,
ADD COLUMN     "STR_TWO_FACTOR_METHOD_SECURITY_SETTINGS" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "STR_TWO_FACTOR_SECRET_SECURITY_SETTINGS" TEXT;

-- AlterTable
ALTER TABLE "SUBSCRIPTION" DROP COLUMN "DTM_CANCELLED_AT",
DROP COLUMN "DTM_END_DATE",
DROP COLUMN "DTM_START_DATE",
DROP COLUMN "DTM_TRIAL_ENDS_AT",
DROP COLUMN "STR_BILLING_CYCLE",
ADD COLUMN     "DTM_CANCELLED_AT_SUBSCRIPTION" TIMESTAMP(3),
ADD COLUMN     "DTM_END_DATE_SUBSCRIPTION" TIMESTAMP(3),
ADD COLUMN     "DTM_START_DATE_SUBSCRIPTION" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "DTM_TRIAL_ENDS_AT_SUBSCRIPTION" TIMESTAMP(3),
ADD COLUMN     "STR_BILLING_CYCLE_SUBSCRIPTION" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "SUBSCRIPTION_PLAN" DROP COLUMN "JSON_FEATURES",
DROP COLUMN "NUM_MAX_DOCUMENTS",
DROP COLUMN "NUM_MAX_TEMPLATES",
DROP COLUMN "NUM_MAX_USERS",
DROP COLUMN "NUM_PRICE_ANNUALLY",
DROP COLUMN "NUM_PRICE_MONTHLY",
ADD COLUMN     "JSON_FEATURES_PLAN" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "NUM_MAX_DOCUMENTS_PLAN" INTEGER,
ADD COLUMN     "NUM_MAX_TEMPLATES_PLAN" INTEGER,
ADD COLUMN     "NUM_MAX_USERS_PLAN" INTEGER,
ADD COLUMN     "NUM_PRICE_ANNUALLY_PLAN" DECIMAL(65,30),
ADD COLUMN     "NUM_PRICE_MONTHLY_PLAN" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "USER" DROP COLUMN "DTM_LAST_LOGIN_AT",
ADD COLUMN     "DTM_DELETED_AT_USER" TIMESTAMP(3),
ADD COLUMN     "DTM_LAST_LOGIN_AT_USER" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "CREDENTIALS_STR_GOOGLE_ID_CREDENTIALS_key" ON "CREDENTIALS"("STR_GOOGLE_ID_CREDENTIALS");

-- CreateIndex
CREATE UNIQUE INDEX "CREDENTIALS_STR_MICROSOFT_ID_CREDENTIALS_key" ON "CREDENTIALS"("STR_MICROSOFT_ID_CREDENTIALS");

-- CreateIndex
CREATE INDEX "DIGITAL_SIGNATURE_DTM_DELETED_AT_SIGNATURE_idx" ON "DIGITAL_SIGNATURE"("DTM_DELETED_AT_SIGNATURE");

-- CreateIndex
CREATE INDEX "DOCUMENT_DTM_DELETED_AT_DOCUMENT_idx" ON "DOCUMENT"("DTM_DELETED_AT_DOCUMENT");

-- CreateIndex
CREATE INDEX "DOCUMENT_UID_CREATED_BY_DOCUMENT_idx" ON "DOCUMENT"("UID_CREATED_BY_DOCUMENT");

-- CreateIndex
CREATE INDEX "DOCUMENT_TEMPLATE_STR_DOCUMENT_TYPE_TEMPLATE_idx" ON "DOCUMENT_TEMPLATE"("STR_DOCUMENT_TYPE_TEMPLATE");

-- CreateIndex
CREATE INDEX "DOCUMENT_TEMPLATE_DTM_DELETED_AT_TEMPLATE_idx" ON "DOCUMENT_TEMPLATE"("DTM_DELETED_AT_TEMPLATE");

-- CreateIndex
CREATE INDEX "FIRM_DTM_DELETED_AT_FIRM_idx" ON "FIRM"("DTM_DELETED_AT_FIRM");

-- CreateIndex
CREATE INDEX "FIRM_MEMBER_STR_INVITE_TOKEN_FIRM_MEMBER_idx" ON "FIRM_MEMBER"("STR_INVITE_TOKEN_FIRM_MEMBER");

-- CreateIndex
CREATE INDEX "LEGAL_BRANCH_BOOL_IS_SYSTEM_LEGAL_BRANCH_idx" ON "LEGAL_BRANCH"("BOOL_IS_SYSTEM_LEGAL_BRANCH");

-- CreateIndex
CREATE INDEX "LEGAL_BRANCH_DTM_DELETED_AT_LEGAL_BRANCH_idx" ON "LEGAL_BRANCH"("DTM_DELETED_AT_LEGAL_BRANCH");

-- CreateIndex
CREATE INDEX "REFRESH_TOKEN_STR_TOKEN_HASH_REFRESH_TOKEN_idx" ON "REFRESH_TOKEN"("STR_TOKEN_HASH_REFRESH_TOKEN");

-- CreateIndex
CREATE INDEX "USER_DTM_DELETED_AT_USER_idx" ON "USER"("DTM_DELETED_AT_USER");

-- AddForeignKey
ALTER TABLE "DOCUMENT" ADD CONSTRAINT "DOCUMENT_UID_CREATED_BY_DOCUMENT_fkey" FOREIGN KEY ("UID_CREATED_BY_DOCUMENT") REFERENCES "USER"("UID_USER") ON DELETE RESTRICT ON UPDATE CASCADE;
