-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 19, 2025 at 04:34 PM
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
-- Database: `nodejsframework`
--

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `item_title` varchar(255) DEFAULT NULL,
  `item_alias` varchar(255) DEFAULT NULL,
  `item_parent` int(11) NOT NULL DEFAULT 0,
  `item_type` varchar(255) DEFAULT NULL,
  `item_category` varchar(255) DEFAULT NULL,
  `item_description` longtext DEFAULT NULL,
  `attachment1` varchar(255) DEFAULT NULL,
  `item_shortdescription` text DEFAULT NULL,
  `user_id` int(11) NOT NULL DEFAULT 0,
  `controller` varchar(50) DEFAULT NULL,
  `action` varchar(50) DEFAULT 'index',
  `published_at` date DEFAULT NULL,
  `published_end_at` date DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `display_status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `deleted_status` enum('Y','N') NOT NULL DEFAULT 'N',
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by_name` varchar(255) DEFAULT NULL,
  `deleted_time` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_section`
--

CREATE TABLE `item_section` (
  `item_section_id` int(11) NOT NULL,
  `item_section_parent_id` int(11) NOT NULL DEFAULT 0,
  `section_title` varchar(255) DEFAULT NULL,
  `section_alias` varchar(255) DEFAULT NULL,
  `item_type` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `attachment1` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `display_status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `deleted_status` enum('Y','N') NOT NULL DEFAULT 'N',
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by_name` varchar(255) DEFAULT NULL,
  `deleted_time` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `role_id` int(11) NOT NULL,
  `role_title` varchar(255) DEFAULT NULL,
  `item_alias` varchar(255) DEFAULT NULL,
  `item_type` varchar(255) NOT NULL DEFAULT 'role',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `display_status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `display_on_listing` enum('Y','N') NOT NULL DEFAULT 'Y',
  `show_action_checkbox` enum('Y','N') NOT NULL DEFAULT 'Y',
  `deleted_status` enum('Y','N') NOT NULL DEFAULT 'N',
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by_name` varchar(255) DEFAULT NULL,
  `deleted_time` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`role_id`, `role_title`, `item_alias`, `item_type`, `display_order`, `display_status`, `display_on_listing`, `show_action_checkbox`, `deleted_status`, `deleted_by`, `deleted_by_name`, `deleted_time`, `created_at`, `updated_at`) VALUES
(1, 'Super Administrator', 'super-administrator', 'role', 4, 'Y', 'N', 'N', 'N', 0, NULL, NULL, '2016-08-01 00:00:00', '2023-04-11 04:12:39'),
(2, 'Administrator', 'administrator', 'role', 1, 'Y', 'Y', 'N', 'N', 0, NULL, NULL, '2019-02-05 02:46:28', '2021-07-20 01:57:34');

-- --------------------------------------------------------

--
-- Table structure for table `role_access`
--

CREATE TABLE `role_access` (
  `role_access_id` int(11) NOT NULL,
  `role_id` int(11) DEFAULT 0,
  `module_id` int(11) DEFAULT 0,
  `grant_add` enum('Y','N') NOT NULL DEFAULT 'N',
  `grant_edit` enum('Y','N') NOT NULL DEFAULT 'N',
  `grant_delete` enum('Y','N') NOT NULL DEFAULT 'N',
  `grant_view` enum('Y','N') NOT NULL DEFAULT 'N',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `display_status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `deleted_status` enum('Y','N') NOT NULL DEFAULT 'N',
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `role_access`
--

INSERT INTO `role_access` (`role_access_id`, `role_id`, `module_id`, `grant_add`, `grant_edit`, `grant_delete`, `grant_view`, `display_order`, `display_status`, `deleted_status`, `created_at`, `updated_at`) VALUES
(33, 7, 287, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(32, 7, 342, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(31, 7, 343, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(30, 7, 344, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(29, 7, 346, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(28, 7, 353, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(27, 7, 358, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(22, 5, 343, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-07 13:08:00', '2019-10-07 07:38:00'),
(34, 7, 282, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(35, 7, 281, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(36, 7, 270, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(37, 7, 269, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(38, 7, 268, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(39, 7, 361, 'Y', 'Y', 'Y', 'N', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(40, 7, 360, 'Y', 'Y', 'Y', 'N', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(41, 7, 359, 'Y', 'Y', 'Y', 'N', 0, 'Y', 'N', '2019-10-11 07:44:08', '2019-10-11 02:14:08'),
(1500, 1, 268, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1499, 1, 269, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1498, 1, 270, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1497, 1, 275, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1496, 1, 281, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1495, 1, 282, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1494, 1, 287, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1493, 1, 342, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1492, 1, 343, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1491, 1, 344, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1490, 1, 346, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1489, 1, 353, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1488, 1, 358, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1487, 1, 359, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1486, 1, 360, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1485, 1, 361, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1484, 1, 546, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1483, 1, 565, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1482, 1, 567, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1481, 1, 580, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1480, 1, 581, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1479, 1, 584, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1478, 1, 585, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1477, 1, 586, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1476, 1, 587, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1475, 1, 588, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1474, 1, 589, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1473, 1, 590, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1333, 2, 281, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1332, 2, 282, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1331, 2, 287, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1330, 2, 342, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1329, 2, 343, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1328, 2, 344, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1327, 2, 346, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1326, 2, 353, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1325, 2, 358, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1324, 2, 359, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1323, 2, 360, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1322, 2, 361, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1321, 2, 546, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1320, 2, 565, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1319, 2, 567, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1318, 2, 580, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1317, 2, 581, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1316, 2, 584, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1315, 2, 585, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1314, 2, 586, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1313, 2, 587, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1312, 2, 588, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1311, 2, 589, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1310, 2, 590, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1309, 2, 591, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1308, 2, 593, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1307, 2, 594, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1306, 2, 595, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1472, 1, 591, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1471, 1, 593, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(616, 3, 358, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(615, 3, 359, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(614, 3, 585, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(613, 3, 586, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(1470, 1, 594, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1305, 2, 600, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1304, 2, 603, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1303, 2, 613, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(612, 3, 587, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(611, 3, 595, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(1469, 1, 595, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1302, 2, 622, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1468, 1, 600, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1344, 4, 358, 'Y', 'Y', 'Y', 'N', 0, 'Y', 'N', '2022-01-20 03:27:46', '2022-01-20 03:27:46'),
(1343, 4, 268, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2022-01-20 03:27:46', '2022-01-20 03:27:46'),
(1342, 4, 359, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2022-01-20 03:27:46', '2022-01-20 03:27:46'),
(1341, 4, 586, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2022-01-20 03:27:46', '2022-01-20 03:27:46'),
(1467, 1, 603, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1301, 2, 625, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1466, 1, 613, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1300, 2, 626, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1465, 1, 622, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1299, 2, 627, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1464, 1, 625, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1298, 2, 639, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(617, 3, 268, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2020-08-22 10:46:22', '2020-08-22 10:46:22'),
(1463, 1, 626, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1462, 1, 627, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1461, 1, 639, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1460, 1, 640, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1459, 1, 641, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1458, 1, 642, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1457, 1, 647, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1456, 1, 648, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1455, 1, 649, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1454, 1, 661, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1453, 1, 662, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1452, 1, 663, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1451, 1, 664, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1450, 1, 670, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1449, 1, 708, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1448, 1, 718, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1447, 1, 1775, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1446, 1, 1776, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1340, 4, 588, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2022-01-20 03:27:46', '2022-01-20 03:27:46'),
(1339, 4, 718, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2022-01-20 03:27:46', '2022-01-20 03:27:46'),
(1445, 1, 1777, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1444, 1, 1780, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1443, 1, 1827, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1442, 1, 1837, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1441, 1, 1838, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1440, 1, 1839, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1439, 1, 1840, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1438, 1, 1841, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1437, 1, 1842, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1436, 1, 1865, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1435, 1, 1887, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1434, 1, 1888, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1297, 2, 640, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1296, 2, 641, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1295, 2, 642, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1294, 2, 647, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1293, 2, 648, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1292, 2, 649, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1291, 2, 661, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1290, 2, 662, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1289, 2, 663, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1288, 2, 664, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1287, 2, 670, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1286, 2, 708, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1285, 2, 718, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1284, 2, 1775, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1283, 2, 1776, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1282, 2, 1777, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1281, 2, 1780, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1280, 2, 1827, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1279, 2, 1837, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1278, 2, 1838, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1277, 2, 1839, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1276, 2, 1840, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1275, 2, 1841, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1274, 2, 1842, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1273, 2, 1865, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1272, 2, 1887, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1271, 2, 1888, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1270, 2, 1892, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1269, 2, 1893, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1268, 2, 1894, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1433, 1, 1892, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1432, 1, 1893, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1267, 2, 1897, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1266, 2, 1901, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1431, 1, 1894, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1430, 1, 1897, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1429, 1, 1901, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1265, 2, 1916, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1264, 2, 1921, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1263, 2, 1946, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:42', '2021-07-20 01:57:42'),
(1428, 1, 1916, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1427, 1, 1921, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1426, 1, 1946, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1425, 1, 2064, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1424, 1, 2065, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1334, 2, 275, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:43', '2021-07-20 01:57:43'),
(1335, 2, 270, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:44', '2021-07-20 01:57:44'),
(1336, 2, 269, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:44', '2021-07-20 01:57:44'),
(1337, 2, 268, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:44', '2021-07-20 01:57:44'),
(1338, 2, 134, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2021-07-20 01:57:44', '2021-07-20 01:57:44'),
(1423, 1, 2235, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49'),
(1501, 1, 134, 'Y', 'Y', 'Y', 'Y', 0, 'Y', 'N', '2023-04-11 04:12:49', '2023-04-11 04:12:49');

-- --------------------------------------------------------

--
-- Table structure for table `site_config`
--

CREATE TABLE `site_config` (
  `config_id` int(11) NOT NULL,
  `config_title` varchar(1024) DEFAULT NULL,
  `config_name` varchar(1024) DEFAULT NULL,
  `config_value` text DEFAULT NULL,
  `input_type` varchar(15) DEFAULT NULL,
  `size` int(11) NOT NULL DEFAULT 100,
  `maxlength` int(11) NOT NULL DEFAULT 100,
  `input_type_title` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT 'textbox',
  `required` enum('Y','N','O') DEFAULT 'O',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `comments` varchar(255) DEFAULT NULL,
  `display_status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `additional` varchar(100) DEFAULT NULL,
  `display_on_dashboard` enum('Y','N') NOT NULL DEFAULT 'N',
  `display_on_third_party` enum('Y','N') NOT NULL DEFAULT 'N',
  `site_config_parent_id` tinyint(4) NOT NULL DEFAULT 0,
  `site_id` tinyint(4) NOT NULL DEFAULT 0,
  `deleted_status` enum('Y','N') NOT NULL DEFAULT 'N',
  `root_user_only` enum('Y','N') NOT NULL DEFAULT 'N',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `site_config`
--

INSERT INTO `site_config` (`config_id`, `config_title`, `config_name`, `config_value`, `input_type`, `size`, `maxlength`, `input_type_title`, `class`, `required`, `display_order`, `comments`, `display_status`, `additional`, `display_on_dashboard`, `display_on_third_party`, `site_config_parent_id`, `site_id`, `deleted_status`, `root_user_only`, `created_at`, `updated_at`) VALUES
(1, 'Application Title', 'FRONT_APPLICATION_TITLE', 'Native App | Website development Company Vadodara', 'text', 100, 100, 'Please enter your application name for display on frontend side as title', 'form-control', 'Y', 1, NULL, 'Y', NULL, 'Y', 'Y', 1, 0, 'N', 'N', '2019-04-11 13:00:00', '2021-08-06 01:23:01'),
(2, 'Records per page', 'FRONT_RECORD_PER_PAGE', '16', 'select', 100, 60, 'Records per page', 'form-control', 'Y', 5, '8@=16@=24@=32@=40@=80', 'Y', NULL, 'Y', 'Y', 1, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(7, 'Maintenance Mode', 'SITE_CONSTRUCTION', 'No', 'select', 100, 60, 'Site Under Construction Status', 'form-control', 'Y', 12, 'Yes@=No', 'Y', NULL, 'Y', 'N', 1, 0, 'N', 'N', '2019-04-11 13:00:00', '2021-12-07 22:07:04'),
(8, 'Default Timezone', 'FRONT_DEFAULT_TIMEZONE', 'Asia/Kolkata', 'select', 100, 60, 'Default Timezone', 'form-control', 'Y', 13, 'America/Chicago@=Asia/Kolkata@=Europe/London@=Australia/Perth', 'Y', NULL, 'Y', 'Y', 1, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(9, 'Backend application Title', 'BACKEND_APPLICATION_TITLE', 'Cloudswift :: Administrator', 'text', 100, 60, 'Application Title', 'form-control', 'Y', 14, NULL, 'Y', NULL, 'Y', 'N', 2, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-10-14 07:08:57'),
(14, 'Meta Description', 'FRONT_META_DESCRIPTION', 'We are the leading Custom Software Solution Company in Vadodara, Gujarat, India who servered more then 50 Clients across World.', 'text', 100, 60, 'Meta Description', 'form-control', 'Y', 1, NULL, 'Y', NULL, 'N', 'N', 1, 0, 'N', 'N', '2019-04-11 13:00:00', '2020-04-17 01:06:07'),
(15, 'Default Robots', 'FRONT_DEFAULT_ROBOTS', 'INDEX,FOLLOW', 'select', 100, 60, 'Default Robots', 'form-control', 'Y', 25, 'INDEX,FOLLOW@=NOINDEX@=NOFOLLOW@=NOINDEX,NOFOLLOW', 'Y', NULL, 'Y', 'Y', 3, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-10-17 08:06:12'),
(38, 'Company Name', 'COMPANY_NAME', 'Cloudswift Solutions Pvt. Ltd.', 'text', 100, 60, 'Company Name', 'form-control', 'Y', 64, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-11-07 22:26:19'),
(39, 'Company Address', 'COMPANY_ADDRESS1', 'Sama, Near Chanikya crossing', 'text', 100, 60, 'Company Address', 'form-control', 'Y', 65, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(40, 'Company Address 2', 'COMPANY_ADDRESS2', '', 'text', 100, 60, 'Company Address 2', 'form-control', 'Y', 66, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-09-24 08:43:53'),
(41, 'City', 'COMPANY_CITY', 'Vadodara', 'text', 100, 60, 'City', 'form-control', 'Y', 67, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(42, 'State', 'COMPANY_STATE', 'GJ', 'text', 100, 60, 'State', 'form-control', 'Y', 68, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(43, 'Country', 'COMPANY_COUNTRY', 'INN', 'text', 100, 60, 'Country', 'form-control', 'Y', 69, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(44, 'Zipcode', 'COMPANY_ZIPCODE', '390009', 'text', 100, 60, 'Zipcode', 'form-control', 'Y', 70, 'max six digits', 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(45, 'Contact Number', 'COMPANY_CONTACT_NUMBER', '886-630-3621', 'text', 100, 60, 'Contact Number', 'form-control', 'Y', 71, NULL, 'Y', NULL, 'N', 'Y', 7, 0, 'N', 'N', '2019-04-11 13:00:00', '2020-04-13 11:50:21'),
(47, 'Contact us email address', 'COMPANY_EMAIL', 'connect@cloudswiftsolutions.com', 'email', 100, 60, 'Contact us email address', 'form-control', 'Y', 74, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 13:00:00', '2021-08-13 00:40:23'),
(48, 'Contact us person name', 'COMPANY_CONTACT_PERSON', 'CloudSwift Solutions', 'text', 100, 60, 'Contact us person name', 'form-control', 'Y', 75, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 13:00:00', '2021-08-13 01:15:54'),
(53, 'Allow Sending emails', 'ALLOW_SENDING_EMAIL', 'Yes', 'select', 100, 5, 'Allow to send email throughout site? If no, not a single email will execute in this project.', 'form-control', 'Y', 82, 'Yes@=No', 'Y', NULL, 'N', 'N', 9, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(67, 'Order email name', 'ORDER_CONTACT_PERSON', 'Cloud Swift Solutions', 'text', 100, 60, 'order person name', 'form-control', 'Y', 75, NULL, 'Y', NULL, 'N', 'N', 8, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-11-18 20:14:30'),
(75, 'From email address', 'FROM_EMAIL_ADDRESS', 'notifications@cloudswiftsolutions.com', 'email', 100, 60, 'from email address', 'form-control', 'Y', 74, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 13:00:00', '2021-06-21 21:54:54'),
(76, 'Backend Logo title display', 'BACKEND_LOGO_TITLE_DISPLAY', 'Administrator', 'text', 100, 60, 'backend_logo_title_display', 'form-control', 'Y', 8, '', 'Y', NULL, 'N', 'Y', 2, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(83, 'Content to display before end of body tag', 'CONTENT_BEFORE_BODY_TAG', '', 'textarea', 100, 6000, 'Please enter content that will before close of body tag.', 'form-control', 'N', 26, NULL, 'Y', NULL, 'N', 'Y', 9, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-09-24 09:24:46'),
(86, 'Script after begin head tag', 'AFTER_HEAD_TAG', '', 'text', 100, 60, 'After head tag javacript script', 'form-control', 'N', 39, NULL, 'Y', NULL, 'N', 'Y', 3, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-09-24 08:43:53'),
(88, 'Application json script', 'APPLICATION_JSON_SCRIPT', '', 'textarea', 100, 6000, 'Application json script', 'form-control', 'N', 26, NULL, 'Y', NULL, 'N', 'Y', 3, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-09-24 09:24:46'),
(97, 'Upload Max Size', 'UPLOAD_MAX_FILESIZE', '2M', 'select', 100, 60, 'Upload Max Size', 'form-control', 'Y', 44, '2M@=8M@=16M@=24M', 'Y', NULL, 'N', 'N', 4, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(102, 'Facebook', 'FACEBOOK_URL', 'https://www.facebook.com/cloudswiftsolutions/', 'text', 100, 60, 'Please enter your facebook page url', 'form-control', 'N', 40, NULL, 'Y', NULL, 'N', 'Y', 10, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-10-14 07:58:52'),
(103, 'Twitter', 'TWITTER_URL', 'https://twitter.com/cloudswiftsolutions', 'text', 100, 60, 'Please enter your twitter page url', 'form-control', 'N', 40, NULL, 'Y', NULL, 'N', 'Y', 10, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-10-14 07:59:00'),
(104, 'Linkedin', 'LINKEDIN_URL', 'https://www.linkedin.com/company/cloudswiftsolutions/', 'text', 100, 60, 'Please enter your Linkedin page url', 'form-control', 'N', 40, NULL, 'Y', NULL, 'N', 'Y', 10, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-10-14 07:59:06'),
(197, 'Allow to sent email to admin for contact,feedback,etc.', 'ALLOW_CONTACT_EMAIL', 'Y', 'select', 100, 60, 'Please select option', 'form-control', 'Y', 5, 'Y@=N', 'Y', NULL, 'Y', 'N', 8, 0, 'N', 'N', '2019-04-11 13:00:00', '2019-04-11 21:45:59'),
(211, 'Application Name', 'FRONT_APPLICATION_NAME', 'Cloudswift Solutions', 'text', 100, 100, 'Please enter your application name for display on frontend side as name', 'form-control', 'Y', 1, NULL, 'Y', NULL, 'Y', 'Y', 1, 0, 'N', 'N', '2019-04-11 18:30:00', '2019-10-14 13:22:59'),
(236, 'Closed Store Status', 'CLOSED_STORE_STATUS', 'N', 'select', 100, 100, 'This store is closed at present.', 'form-control', 'Y', 1, 'Y@=N', 'Y', NULL, 'Y', 'Y', 1, 0, 'N', 'N', '2019-04-11 18:30:00', '2021-08-02 10:54:46'),
(237, 'Closed Store Message', 'CLOSED_STORE_MESSAGE', 'Store is Under Construction', 'text', 100, 100, 'Closed Store Message', 'form-control', 'Y', 1, NULL, 'Y', NULL, 'Y', 'Y', 1, 0, 'N', 'N', '2019-04-11 18:30:00', '2021-08-02 10:52:45'),
(241, 'BCC Email 1', 'BCC_EMAIL_1', 'bcc\'\"\'[]=-0./>?.13@gmail.com', 'email', 100, 60, 'BCC Email', 'form-control', 'Y', 74, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 18:30:00', '2025-05-19 14:15:16'),
(243, 'SMTP HOST', 'SMTP_HOST', 'smtp.hostinger.com', 'text', 100, 60, 'SMTP HOST', 'form-control', 'Y', 74, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 18:30:00', '2021-08-13 06:20:26'),
(244, 'SMTP PORT', 'SMTP_PORT', '587', 'text', 100, 60, 'SMTP Port', 'form-control', 'Y', 74, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 18:30:00', '2023-09-16 22:32:56'),
(245, 'SMTP PASSWORD', 'SMTP_PASSWORD', 'Cloud@112018', 'email', 100, 60, 'SMTP PASSWORD', 'form-control', 'Y', 74, NULL, 'Y', NULL, 'N', 'Y', 8, 0, 'N', 'N', '2019-04-11 18:30:00', '2021-08-13 06:20:26');

-- --------------------------------------------------------

--
-- Table structure for table `site_config_parent`
--

CREATE TABLE `site_config_parent` (
  `site_config_parent_id` int(10) UNSIGNED NOT NULL,
  `site_config_title` varchar(191) NOT NULL,
  `display_order` int(11) NOT NULL,
  `display_status` enum('Y','N') NOT NULL,
  `class` varchar(191) NOT NULL,
  `site_id` int(11) NOT NULL,
  `deleted_status` enum('Y','N') NOT NULL,
  `root_user_only` enum('Y','N') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `site_config_parent`
--

INSERT INTO `site_config_parent` (`site_config_parent_id`, `site_config_title`, `display_order`, `display_status`, `class`, `site_id`, `deleted_status`, `root_user_only`, `created_at`, `updated_at`) VALUES
(1, 'Frontend Settings', 1, 'Y', 'collapseOne', 0, 'N', 'N', NULL, NULL),
(2, 'Backend Settings', 2, 'Y', 'collapseTwo', 0, 'N', 'N', NULL, NULL),
(3, 'SEO Settings', 3, 'Y', 'collapseThree', 0, 'N', 'N', NULL, NULL),
(4, 'Security Settings', 4, 'Y', 'collapseFour', 0, 'N', 'Y', NULL, NULL),
(7, 'Site Details', 7, 'Y', 'collapseSeven', 0, 'N', 'N', NULL, NULL),
(8, 'Email Settings', 8, 'Y', 'collapseEight', 0, 'N', 'N', NULL, NULL),
(9, 'Privacy Settings', 9, 'Y', 'collapseNine', 0, 'N', 'Y', NULL, NULL),
(10, 'Follow Us', 10, 'Y', 'collapseTen', 0, 'N', 'Y', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `user_firstname` varchar(255) DEFAULT NULL,
  `user_lastname` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_password` varchar(255) DEFAULT NULL,
  `user_token` varchar(255) DEFAULT NULL,
  `user_photo` varchar(255) DEFAULT NULL,
  `user_role_id` tinyint(4) NOT NULL DEFAULT 0,
  `active_status` varchar(25) NOT NULL DEFAULT 'N',
  `display_status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `deleted_status` varchar(4) NOT NULL DEFAULT 'N',
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `user_firstname`, `user_lastname`, `user_name`, `user_email`, `user_password`, `user_token`, `user_photo`, `user_role_id`, `active_status`, `display_status`, `deleted_status`, `created_at`, `updated_at`) VALUES
(1, 'Cloudswift', 'Solutions', 'cloudswiftsolutions', 'cloudswiftsolutions@gmail.com', '$2a$10$PBjaz1baciorECDSkLnKYusIL/1xOah8L8D77Wg.ZXWecF9fg5tyq', '', NULL, 1, 'Y', 'Y', 'N', '2025-05-16 10:17:06', '2025-05-17 14:46:17'),
(2, 'Second', 'Solutions', 'cloudswiftsolutions', 'cloudswiftsolutions@yahoo.com', '$2a$10$kJTPNZHNRH8L.YWfYLqsX.eZNpNRvzW/6ZnqD0nauEpxObP2kDw26', NULL, NULL, 1, 'Y', 'Y', 'N', '2025-05-16 10:17:06', '2025-05-17 14:03:51'),
(3, 'Third', 'Solutions', 'cloudswiftsolutions', 'gmail@yahoo.com', '$2a$10$kJTPNZHNRH8L.YWfYLqsX.eZNpNRvzW/6ZnqD0nauEpxObP2kDw26', NULL, NULL, 1, 'Y', 'Y', 'N', '2025-05-16 10:17:06', '2025-05-17 14:03:51'),
(4, 'Fourth', 'Solutions', 'cloudswiftsolutions', 'patel@gmail.com', '$2a$10$kJTPNZHNRH8L.YWfYLqsX.eZNpNRvzW/6ZnqD0nauEpxObP2kDw26', NULL, NULL, 1, 'Y', 'Y', 'N', '2025-05-16 10:17:06', '2025-05-17 14:03:51'),
(5, 'Fifth', 'Name', 'cloudswiftsolutions', 'fifth@gmail.com', '$2a$10$kJTPNZHNRH8L.YWfYLqsX.eZNpNRvzW/6ZnqD0nauEpxObP2kDw26', NULL, NULL, 2, 'Y', 'Y', 'N', '2025-05-16 10:17:06', '2025-05-17 14:03:51'),
(6, 'ID', '6', NULL, 'id6@yopmail.com', NULL, NULL, NULL, 2, 'Y', 'Y', 'N', '2025-05-17 16:13:07', '2025-05-17 14:03:51'),
(7, 'ID', '7', NULL, 'id7@yopmail.com', NULL, NULL, NULL, 2, 'Y', 'Y', 'N', '2025-05-17 16:14:49', '2025-05-17 14:03:51'),
(8, 'ID', '8', NULL, 'id8@yopmail.com', NULL, NULL, NULL, 2, 'Y', 'Y', 'N', '2025-05-17 16:16:26', '2025-05-17 14:03:51'),
(9, 'ID', '9', NULL, 'id9@yopmail.com', NULL, NULL, NULL, 1, 'Y', 'Y', 'N', '2025-05-17 16:30:08', '2025-05-17 14:07:44'),
(10, 'ID10\'\";1\"\'/!@#$%^&*()_+{}|\":<>?', 'ID10\'\";1\"\'/', NULL, 'asdf@yopmail.com', NULL, NULL, NULL, 1, 'Y', 'Y', 'Y', '2025-05-17 17:27:04', '2025-05-17 14:02:32'),
(11, 'ID12345', 'ID12345', NULL, 'ID12345@yopmail.com', NULL, NULL, NULL, 1, 'N', 'Y', 'N', '2025-05-17 17:29:48', '2025-05-17 14:07:33'),
(12, 'mike', 'mike', NULL, 'mike@yopmail.com', NULL, NULL, NULL, 1, 'Y', 'Y', 'N', '2025-05-17 17:31:23', '2025-05-17 14:03:51'),
(13, 'Mayank', 'Patel', NULL, 'maynk.13@gmail.com', NULL, NULL, NULL, 2, 'Y', 'Y', 'N', '2025-05-17 19:43:18', '2025-05-17 14:13:18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `item_section`
--
ALTER TABLE `item_section`
  ADD PRIMARY KEY (`item_section_id`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `role_access`
--
ALTER TABLE `role_access`
  ADD PRIMARY KEY (`role_access_id`);

--
-- Indexes for table `site_config`
--
ALTER TABLE `site_config`
  ADD PRIMARY KEY (`config_id`);

--
-- Indexes for table `site_config_parent`
--
ALTER TABLE `site_config_parent`
  ADD PRIMARY KEY (`site_config_parent_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_section`
--
ALTER TABLE `item_section`
  MODIFY `item_section_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `role_access`
--
ALTER TABLE `role_access`
  MODIFY `role_access_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1502;

--
-- AUTO_INCREMENT for table `site_config`
--
ALTER TABLE `site_config`
  MODIFY `config_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT for table `site_config_parent`
--
ALTER TABLE `site_config_parent`
  MODIFY `site_config_parent_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
