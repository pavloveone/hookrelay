import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1789587409290 implements MigrationInterface {
    name = 'InitSchema1789587409290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."endpoint_status_enum" AS ENUM('active', 'disabled')`);
        await queryRunner.query(`CREATE TYPE "public"."endpoint_circuitstate_enum" AS ENUM('closed', 'open', 'half_open')`);
        await queryRunner.query(`CREATE TABLE "endpoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "secret" character varying NOT NULL, "subscribedEventTypes" text array NOT NULL, "status" "public"."endpoint_status_enum" NOT NULL DEFAULT 'active', "circuitState" "public"."endpoint_circuitstate_enum" NOT NULL DEFAULT 'closed', "consecutiveFailures" integer NOT NULL DEFAULT '0', "circuitOpenedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid, CONSTRAINT "PK_7785c5c2cf24e6ab3abb7a2e89f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "apiKey" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventType" character varying NOT NULL, "payload" jsonb NOT NULL, "idempotencyKey" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid, CONSTRAINT "UQ_8251468495fd444322f45cfc28c" UNIQUE ("tenantId", "idempotencyKey"), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "delivery_attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptNumber" integer NOT NULL DEFAULT '0', "httpStatusCode" integer, "responseBody" text, "durationMs" integer NOT NULL, "error" character varying, "attemptedAt" TIMESTAMP NOT NULL DEFAULT now(), "deliveryId" uuid, CONSTRAINT "PK_a43b0e18756fc86d042eeef093b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."delivery_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'exhausted')`);
        await queryRunner.query(`CREATE TABLE "delivery" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."delivery_status_enum" NOT NULL DEFAULT 'pending', "attemptCount" integer NOT NULL DEFAULT '0', "nextRetryAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "eventId" uuid, "endpointId" uuid, CONSTRAINT "PK_ffad7bf84e68716cd9af89003b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "endpoint" ADD CONSTRAINT "FK_c85d3f7eaadd289a9c8ba2572e2" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_4daf810855c05534a30a83f1720" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_attempt" ADD CONSTRAINT "FK_d10aa9677673d14fbe05794dde0" FOREIGN KEY ("deliveryId") REFERENCES "delivery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery" ADD CONSTRAINT "FK_b46e8059128640709ad14754960" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery" ADD CONSTRAINT "FK_a4315a709749d90ad774e1c34d0" FOREIGN KEY ("endpointId") REFERENCES "endpoint"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery" DROP CONSTRAINT "FK_a4315a709749d90ad774e1c34d0"`);
        await queryRunner.query(`ALTER TABLE "delivery" DROP CONSTRAINT "FK_b46e8059128640709ad14754960"`);
        await queryRunner.query(`ALTER TABLE "delivery_attempt" DROP CONSTRAINT "FK_d10aa9677673d14fbe05794dde0"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_4daf810855c05534a30a83f1720"`);
        await queryRunner.query(`ALTER TABLE "endpoint" DROP CONSTRAINT "FK_c85d3f7eaadd289a9c8ba2572e2"`);
        await queryRunner.query(`DROP TABLE "delivery"`);
        await queryRunner.query(`DROP TYPE "public"."delivery_status_enum"`);
        await queryRunner.query(`DROP TABLE "delivery_attempt"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "endpoint"`);
        await queryRunner.query(`DROP TYPE "public"."endpoint_circuitstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."endpoint_status_enum"`);
    }

}
