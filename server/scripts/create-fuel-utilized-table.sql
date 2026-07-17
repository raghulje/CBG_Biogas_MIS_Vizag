-- Run this SQL manually on your database (MySQL).
-- Table: mis_fuel_utilized (Fuel Utilized section in MIS Entry)

CREATE TABLE IF NOT EXISTS `mis_fuel_utilized` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entry_id` int(11) NOT NULL,
  `fuel_type` varchar(255) NOT NULL COMMENT 'Petrol or Diesel',
  `customer_id` int(11) NOT NULL,
  `quantity` double NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mis_fuel_utilized_entry_id` (`entry_id`),
  KEY `mis_fuel_utilized_customer_id` (`customer_id`),
  CONSTRAINT `fk_mis_fuel_utilized_entry_id` FREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mis_fuel_utilized_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
