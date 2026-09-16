-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 15, 2026 at 07:26 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fresco_laundry`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `name`, `username`, `password`, `created_at`) VALUES
(1, 'Fresco', 'Fresco_Admin', '$2b$10$o0saNPjKU2KPj2AOpIELZOdVKMbB4.3TTcd1xM9zsUiKGn4cH5RDu', '2026-09-15 04:16:00');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `name`, `phone`, `address`, `created_at`, `updated_at`) VALUES
(1, 'Maria Santos', '09123456789', 'aaa', '2026-09-14 06:35:58', '2026-09-15 04:43:01');

-- --------------------------------------------------------

--
-- Table structure for table `laundry_orders`
--

CREATE TABLE `laundry_orders` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_reference` varchar(30) NOT NULL,
  `tracking_token` varchar(100) NOT NULL,
  `service_id` int(11) NOT NULL,
  `load_type` enum('Small','Medium','Large') NOT NULL,
  `special_instructions` text DEFAULT NULL,
  `pickup_date` date NOT NULL,
  `pickup_time` time NOT NULL,
  `order_status` enum('Pending','Accepted','In Progress','Ready for Pickup','Completed','Cancelled','Rejected') NOT NULL DEFAULT 'Pending',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `laundry_orders`
--

INSERT INTO `laundry_orders` (`order_id`, `customer_id`, `order_reference`, `tracking_token`, `service_id`, `load_type`, `special_instructions`, `pickup_date`, `pickup_time`, `order_status`, `total_amount`, `created_at`, `updated_at`) VALUES
(1, 1, 'FRC-0001', 'TRK-K5NUKV', 1, 'Medium', NULL, '2026-09-14', '14:30:00', 'Accepted', 80.00, '2026-09-14 06:35:58', '2026-09-15 04:43:44'),
(2, 1, 'FRC-0002', 'TRK-BU6FDY', 1, 'Medium', NULL, '2026-09-15', '10:00:00', 'Completed', 80.00, '2026-09-15 04:43:01', '2026-09-15 04:48:32');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_type` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `status_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_status_history`
--

INSERT INTO `order_status_history` (`status_id`, `order_id`, `status`, `note`, `updated_at`) VALUES
(1, 1, 'Pending', 'Laundry request submitted by customer.', '2026-09-14 06:35:58'),
(3, 2, 'Pending', 'Laundry request submitted by customer.', '2026-09-15 04:43:01'),
(4, 1, 'Accepted', NULL, '2026-09-15 04:43:44'),
(5, 2, 'Accepted', NULL, '2026-09-15 04:47:17'),
(6, 2, 'In Progress', NULL, '2026-09-15 04:47:36'),
(7, 2, 'In Progress', NULL, '2026-09-15 04:48:01'),
(8, 2, 'In Progress', NULL, '2026-09-15 04:48:12'),
(9, 2, 'Ready for Pickup', NULL, '2026-09-15 04:48:22'),
(10, 2, 'Completed', NULL, '2026-09-15 04:48:32');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','GCash') NOT NULL,
  `payment_status` enum('Pending','Paid') NOT NULL DEFAULT 'Pending',
  `payment_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `order_id`, `amount`, `payment_method`, `payment_status`, `payment_date`, `created_at`, `updated_at`) VALUES
(3, 1, 80.00, 'Cash', 'Pending', NULL, '2026-09-15 04:36:07', '2026-09-15 04:36:07'),
(4, 2, 80.00, 'GCash', 'Paid', '2026-09-15 04:51:56', '2026-09-15 04:51:56', '2026-09-15 04:51:56');

-- --------------------------------------------------------

--
-- Table structure for table `services_offered`
--

CREATE TABLE `services_offered` (
  `service_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `starting_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `icon` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services_offered`
--

INSERT INTO `services_offered` (`service_id`, `name`, `description`, `starting_price`, `icon`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Wash & Fold', 'Fresh, clean clothes neatly folded and ready to put away.', 70.00, 'check-circle', 1, '2026-09-14 05:55:15', '2026-09-15 05:39:21'),
(2, 'Wash, Dry & Fold', 'Full-service laundry — washed, dried, and neatly folded for you.', 120.00, 'cloud', 1, '2026-09-14 05:55:15', '2026-09-14 05:55:15'),
(3, 'Dry Cleaning', 'Professional care for your delicate and formal garments.', 200.00, 'sparkles', 1, '2026-09-14 05:55:15', '2026-09-14 05:55:15'),
(4, 'Iron Only', 'Expertly pressed clothes without the wash — perfect for office wear.', 50.00, 'iron', 1, '2026-09-14 05:55:15', '2026-09-14 05:55:15');

-- --------------------------------------------------------

--
-- Table structure for table `shop_information`
--

CREATE TABLE `shop_information` (
  `shop_id` int(11) NOT NULL,
  `shop_name` varchar(150) NOT NULL DEFAULT 'FRESCO',
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `monday_open` time DEFAULT NULL,
  `monday_close` time DEFAULT NULL,
  `tuesday_open` time DEFAULT NULL,
  `tuesday_close` time DEFAULT NULL,
  `wednesday_open` time DEFAULT NULL,
  `wednesday_close` time DEFAULT NULL,
  `thursday_open` time DEFAULT NULL,
  `thursday_close` time DEFAULT NULL,
  `friday_open` time DEFAULT NULL,
  `friday_close` time DEFAULT NULL,
  `saturday_open` time DEFAULT NULL,
  `saturday_close` time DEFAULT NULL,
  `sunday_open` time DEFAULT NULL,
  `sunday_close` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_information`
--

INSERT INTO `shop_information` (`shop_id`, `shop_name`, `phone`, `email`, `address`, `monday_open`, `monday_close`, `tuesday_open`, `tuesday_close`, `wednesday_open`, `wednesday_close`, `thursday_open`, `thursday_close`, `friday_open`, `friday_close`, `saturday_open`, `saturday_close`, `sunday_open`, `sunday_close`, `created_at`, `updated_at`) VALUES
(1, 'FRESCO', '(02) 8123-4567', 'hello@fresco.ph', '123 Katipunan Ave., Quezon City', '07:00:00', '19:00:00', '07:00:00', '19:00:00', '07:00:00', '19:00:00', '07:00:00', '19:00:00', '07:00:00', '19:00:00', '08:00:00', '18:00:00', '09:00:00', '15:00:00', '2026-09-14 05:55:15', '2026-09-15 05:18:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`);

--
-- Indexes for table `laundry_orders`
--
ALTER TABLE `laundry_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_reference` (`order_reference`),
  ADD UNIQUE KEY `tracking_token` (`tracking_token`),
  ADD KEY `fk_laundry_orders_customer` (`customer_id`),
  ADD KEY `fk_laundry_orders_service` (`service_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `fk_order_items_order` (`order_id`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`status_id`),
  ADD KEY `fk_status_history_order` (`order_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payments_order` (`order_id`);

--
-- Indexes for table `services_offered`
--
ALTER TABLE `services_offered`
  ADD PRIMARY KEY (`service_id`);

--
-- Indexes for table `shop_information`
--
ALTER TABLE `shop_information`
  ADD PRIMARY KEY (`shop_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `laundry_orders`
--
ALTER TABLE `laundry_orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `services_offered`
--
ALTER TABLE `services_offered`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `shop_information`
--
ALTER TABLE `shop_information`
  MODIFY `shop_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `laundry_orders`
--
ALTER TABLE `laundry_orders`
  ADD CONSTRAINT `fk_laundry_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laundry_orders_service` FOREIGN KEY (`service_id`) REFERENCES `services_offered` (`service_id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `laundry_orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `laundry_orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `laundry_orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
