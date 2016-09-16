DROP DATABASE IF EXISTS `phh-isu2016`;
CREATE DATABASE IF NOT EXISTS `phh-isu2016`;

CREATE TABLE IF NOT EXISTS `phh-isu2016`.`access_logs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `domain` varchar(255),
  `path` varchar(255),
  `category` varchar(255),
  `user_agent` varchar(255),
  `os` varchar(255),
  `version` varchar(255)
);
