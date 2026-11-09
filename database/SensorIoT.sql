
-- =========================================================
-- 0. Tao co so du lieu
-- =========================================================

CREATE DATABASE IF NOT EXISTS `SensorIoT`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `SensorIoT`;


-- =========================================================
-- 1. Bang User
-- Luu tai khoan va thong tin nguoi dung
-- =========================================================

CREATE TABLE `User` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Username` VARCHAR(100) NOT NULL UNIQUE,
    `Password` VARCHAR(255) NOT NULL,
    `Date` DATE,
    `MSV` VARCHAR(20) NOT NULL UNIQUE,
    `Github` VARCHAR(255),
    `Figma` VARCHAR(255),
    `Postman` VARCHAR(255),
    `Report` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 2. Bang Sensor
-- Luu cac cam bien gan voi ESP8266_001
-- Khong luu deviceId vi Devices bay gio la thiet bi dau ra
-- =========================================================

CREATE TABLE `Sensor` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL UNIQUE,
    `Unit` VARCHAR(50) NOT NULL,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `Devices` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL UNIQUE,
    `Description` TEXT,
    `Status` ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
    `sensorId` INT NOT NULL UNIQUE,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_devices_sensor`
        FOREIGN KEY (`sensorId`)
        REFERENCES `Sensor`(`Id`)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 4. Bang SensorData
-- Luu gia tri cam bien theo thoi gian
-- =========================================================

CREATE TABLE `SensorData` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `sensorId` INT NOT NULL,
    `Value` DECIMAL(10,2) NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_sensor_data_sensor`
        FOREIGN KEY (`sensorId`)
        REFERENCES `Sensor`(`Id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 5. Bang ActionHistory
-- Luu lich su nguoi dung bat/tat thiet bi dau ra
-- Khong can sensorId trong bang nay
-- =========================================================

CREATE TABLE `ActionHistory` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `userId` INT NOT NULL,
    `deviceId` INT NOT NULL,

    `Action` ENUM('ON', 'OFF') NOT NULL,

    `Status` ENUM('PENDING', 'SUCCESS', 'FAIL')
        NOT NULL DEFAULT 'PENDING',

    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_action_user`
        FOREIGN KEY (`userId`)
        REFERENCES `User`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_action_device`
        FOREIGN KEY (`deviceId`)
        
        REFERENCES `Devices`(`Id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
