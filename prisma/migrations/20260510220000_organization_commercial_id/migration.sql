-- Instruction 4A: unique 10-digit commercial identifier per organization

ALTER TABLE "organizations" ADD COLUMN "commercialId" VARCHAR(10);

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt") AS rn FROM "organizations"
)
UPDATE "organizations" AS o
SET "commercialId" = lpad((1000000000 + n.rn)::text, 10, '0')
FROM numbered AS n
WHERE o.id = n.id;

ALTER TABLE "organizations" ALTER COLUMN "commercialId" SET NOT NULL;

CREATE UNIQUE INDEX "organizations_commercialId_key" ON "organizations"("commercialId");
