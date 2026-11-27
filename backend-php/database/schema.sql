-- SmartReceipt AI - MySQL Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB (XAMPP / WAMP / cPanel / phpMyAdmin)

CREATE DATABASE IF NOT EXISTS `smartreceipt_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smartreceipt_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `monthly_budget` DECIMAL(12, 2) DEFAULT 10000.00,
  `preferred_categories` TEXT NULL,
  `avatar_url` VARCHAR(512) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Receipts Table
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `store_name` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `category` VARCHAR(64) NOT NULL DEFAULT 'Other',
  `payment_method` VARCHAR(64) DEFAULT 'Cash',
  `tax_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `raw_text` LONGTEXT NULL,
  `image_url` LONGTEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_receipts` (`user_id`),
  INDEX `idx_receipt_date` (`date`),
  CONSTRAINT `fk_receipts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Receipt Items Table
CREATE TABLE IF NOT EXISTS `receipt_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(8, 2) DEFAULT 1.00,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `category` VARCHAR(64) DEFAULT 'Other',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_items_receipt` (`receipt_id`),
  CONSTRAINT `fk_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Category Budgets Table
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `allocated_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `month_year` VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_user_category_month` (`user_id`, `category`, `month_year`),
  CONSTRAINT `fk_budgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(128) NOT NULL DEFAULT 'Administrator',
  `role` VARCHAR(32) NOT NULL DEFAULT 'superadmin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Admin Account
INSERT INTO `admins` (`id`, `email`, `password`, `name`, `role`)
VALUES ('admin-1', 'adminside2026@gmail.com', 'admin@2026', 'Master Admin', 'superadmin')
ON DUPLICATE KEY UPDATE `password` = 'admin@2026';

-- Seed Default Demo User
INSERT INTO `users` (`id`, `name`, `email`, `password`, `monthly_budget`)
VALUES ('demo-user-1', 'Rahul Sharma', 'rahul@expenseinsight.com', 'demo@123', 15000.00)
ON DUPLICATE KEY UPDATE `name` = 'Rahul Sharma';
