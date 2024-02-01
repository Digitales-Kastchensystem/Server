-- Instructions to prepare the database for the dks.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DROP TABLE IF EXISTS `classes`;
CREATE TABLE IF NOT EXISTS `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `formteacher` text NOT NULL,
  `title` text NOT NULL,
  `ausgange` int(11) NOT NULL,
  `studien` int(11) NOT NULL,
  `editing` int(11) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;

INSERT INTO `classes` (`formteacher`, `title`, `ausgange`, `studien`, `editing`) VALUES ('admin', 'Example', 10, 10, 0);

DROP TABLE IF EXISTS `resets`;
CREATE TABLE IF NOT EXISTS `resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` text NOT NULL,
  `code` int(11) NOT NULL DEFAULT '0',
  `used` int(11) NOT NULL DEFAULT '0'
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `setting` text NOT NULL,
  `value` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `timetable`;
CREATE TABLE IF NOT EXISTS `timetable` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `owner` text NOT NULL,
  `timetable` longtext NOT NULL,
  `ausgange` int(11) NOT NULL,
  `studien` int(11) NOT NULL,
  `class_sync` int(11) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=33 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` text NOT NULL,
  `email` text NOT NULL,
  `first_name` text NOT NULL,
  `last_name` text NOT NULL,
  `last_change` text,
  `editable` int(11) NOT NULL DEFAULT '0',
  `colorful` int(11) NOT NULL DEFAULT '0',
  `type` text NOT NULL,
  `class` text NOT NULL,
  `password` text NOT NULL,
  `token` text
) ENGINE=MyISAM AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;

CREATE TABLE `sutotoggles` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `class` varchar(12) NOT NULL,
  `enableday` int(11) NOT NULL DEFAULT 1,
  `enabletime` varchar(12) NOT NULL DEFAULT '00:00',
  `disableday` int(11) NOT NULL DEFAULT 1,
  `disabletime` varchar(12) NOT NULL DEFAULT '00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `users` (`id`, `username`, `email`, `first_name`, `last_name`, `last_change`, `editable`, `colorful`, `type`, `class`, `password`, `token`) VALUES
(4, 'admin', 'admin@email.com', 'Admin', 'Admin', '0.0.0', 0, 1, 'admin', 'Example', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '');
COMMIT;
