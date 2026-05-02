-- Migration: add_item_category_promo
-- Adds: ItemCategory.PROMO so the shop can sell partner promo codes
-- (IVI / VK Music / Yandex Plus / Yandex Eda) alongside furniture and pets.

ALTER TYPE "ItemCategory" ADD VALUE 'PROMO';
