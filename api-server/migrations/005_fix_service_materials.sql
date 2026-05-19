-- Fix service_materials column names: camelCase → snake_case
ALTER TABLE service_materials RENAME COLUMN "serviceId" TO service_id;
ALTER TABLE service_materials RENAME COLUMN "inventoryId" TO inventory_id;
ALTER TABLE service_materials RENAME COLUMN "itemId" TO item_id;
