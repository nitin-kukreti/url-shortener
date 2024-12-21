import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationFile1734773442194 implements MigrationInterface {
    name = 'MigrationFile1734773442194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "url_clicks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ipAddress" character varying(255) NOT NULL, "userAgent" character varying(255) NOT NULL, "osType" character varying(255) NOT NULL, "deviceType" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "shortUrlId" uuid, CONSTRAINT "PK_20545f3b3f435330df663d28dc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "short_urls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alias" character varying(255) NOT NULL, "longUrl" character varying(255) NOT NULL, "topic" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_432aa3bebf85febbf5fb606a45c" UNIQUE ("alias"), CONSTRAINT "PK_0bee0ef97594699927c1b7c81a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "googleId" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "url_clicks" ADD CONSTRAINT "FK_d83371be5915834922dddbfd209" FOREIGN KEY ("shortUrlId") REFERENCES "short_urls"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "short_urls" ADD CONSTRAINT "FK_a5ba995252a5de71f022a4ec917" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "short_urls" DROP CONSTRAINT "FK_a5ba995252a5de71f022a4ec917"`);
        await queryRunner.query(`ALTER TABLE "url_clicks" DROP CONSTRAINT "FK_d83371be5915834922dddbfd209"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "short_urls"`);
        await queryRunner.query(`DROP TABLE "url_clicks"`);
    }

}
