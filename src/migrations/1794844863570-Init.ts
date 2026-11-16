import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1794844863570 implements MigrationInterface {
    name = 'Init1794844863570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Lead" ("id" text NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "phone" text, "company" text NOT NULL, "status" text NOT NULL DEFAULT 'new', "tags" text array, "notes" text, "source" text, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "closedAt" TIMESTAMP(3), "closedById" text, "assignedToId" text, "assignedToName" text, CONSTRAINT "Lead_pkey" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "Lead_assignedToId_idx" ON "Lead" ("assignedToId") `);
        await queryRunner.query(`CREATE INDEX "Lead_closedById_idx" ON "Lead" ("closedById") `);
        await queryRunner.query(`CREATE INDEX "Lead_status_statusChangedAt_idx" ON "Lead" ("status", "statusChangedAt") `);
        await queryRunner.query(`CREATE TABLE "Note" ("id" text NOT NULL, "text" text NOT NULL, "leadId" text NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(), CONSTRAINT "Note_pkey" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Activity" ("id" text NOT NULL, "leadId" text NOT NULL, "type" text NOT NULL, "description" text NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "userId" text, "userName" text NOT NULL DEFAULT '', CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Activity" DROP CONSTRAINT "Activity_leadId_fkey"`);
        await queryRunner.query(`ALTER TABLE "Note" DROP CONSTRAINT "Note_leadId_fkey"`);
        await queryRunner.query(`DROP TABLE "Activity"`);
        await queryRunner.query(`DROP TABLE "Note"`);
        await queryRunner.query(`DROP INDEX "public"."Lead_status_statusChangedAt_idx"`);
        await queryRunner.query(`DROP INDEX "public"."Lead_closedById_idx"`);
        await queryRunner.query(`DROP INDEX "public"."Lead_assignedToId_idx"`);
        await queryRunner.query(`DROP TABLE "Lead"`);
    }

}
