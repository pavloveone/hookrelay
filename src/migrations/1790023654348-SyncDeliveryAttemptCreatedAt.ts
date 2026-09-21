import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncDeliveryAttemptCreatedAt1790023654348 implements MigrationInterface {
    name = 'SyncDeliveryAttemptCreatedAt1790023654348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_attempt" RENAME COLUMN "attemptedAt" TO "createdAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_attempt" RENAME COLUMN "createdAt" TO "attemptedAt"`);
    }

}
