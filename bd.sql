-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.11.19-MariaDB-ubu2204 - mariadb.org binary distribution
-- SO del servidor:              debian-linux-gnu
-- HeidiSQL Versión:             12.21.0.7344
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Volcando estructura para tabla inventario_db.empleados
CREATE TABLE IF NOT EXISTS `empleados` (
  `cedula` varchar(45) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `foto` varchar(100) NOT NULL,
  `cargo` varchar(45) NOT NULL,
  `sueldoBase` decimal(10,2) NOT NULL,
  `horasExtras` int(11) NOT NULL,
  PRIMARY KEY (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla inventario_db.empleados: ~4 rows (aproximadamente)
INSERT INTO `empleados` (`cedula`, `nombre`, `foto`, `cargo`, `sueldoBase`, `horasExtras`) VALUES
	('V-122122112', 'Yoalice Muñoz', '', 'Manager', 156000.00, 30),
	('V-1882828', 'Roberth Idrobo', 'foto-1783802514282-908495399.jpg', 'Barrendero', 1000.00, 999),
	('V-26626262', 'Claudia Montilla', 'foto-1783799137802-829544323.jpeg', 'Dev', 1000.00, 5),
	('V-32117825', 'Sebastian Briceño', 'foto-1788912023744-901208485.jpg', 'Dev', 18000.00, 19);

-- Volcando estructura para tabla inventario_db.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuarios` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(45) NOT NULL,
  `hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_usuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla inventario_db.usuarios: ~0 rows (aproximadamente)
INSERT INTO `usuarios` (`id_usuarios`, `user`, `hash`) VALUES
	(1, 'sysnom@gmail.com', '$2b$10$IJIN4HaW3o5Rv4ADPgX4ruFNY8vKtPSBXXJS46r67FfODvjzAgQGq');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
