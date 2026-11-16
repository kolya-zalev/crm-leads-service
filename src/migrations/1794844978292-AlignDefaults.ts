import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignDefaults1794844978292 implements MigrationInterface {
    name = 'AlignDefaults1794844978292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."Lead_status_statusChangedAt_idx"`);
        await queryRunner.query(`ALTER TABLE "Lead" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Lead" ALTER COLUMN "statusChangedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Note" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Note" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Activity" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "Lead_status_statusChangedAt_idx" ON "Lead" ("status", "statusChangedAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."Lead_status_statusChangedAt_idx"`);
        await queryRunner.query(`ALTER TABLE "Activity" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Note" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Note" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Lead" ALTER COLUMN "statusChangedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Lead" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "Lead_status_statusChangedAt_idx" ON "Lead" ("status", "statusChangedAt") `);
    }

}
