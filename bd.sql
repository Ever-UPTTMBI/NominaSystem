-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Base de Datos:                inventario_db (Sistema de Nómina)
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `inventario_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `inventario_db`;

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuarios` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(45) NOT NULL,
  `hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_usuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarios` (`id_usuarios`, `user`, `hash`) VALUES
	(1, 'sysnom@gmail.com', '$2b$10$IJIN4HaW3o5Rv4ADPgX4ruFNY8vKtPSBXXJS46r67FfODvjzAgQGq');

-- 2. Tabla: departamentos
CREATE TABLE IF NOT EXISTS `departamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `departamentos` (`id`, `nombre`, `descripcion`) VALUES
	(1, 'Tecnología y Desarrollo', 'Equipo de desarrollo de software y soporte técnico'),
	(2, 'Administración y Finanzas', 'Gestión contable, compras y recursos financieros'),
	(3, 'Recursos Humanos', 'Gestión del talento humano y nómina'),
	(4, 'Operaciones y Logística', 'Mantenimiento, servicios generales y operaciones');

-- 3. Tabla: empleados
CREATE TABLE IF NOT EXISTS `empleados` (
  `cedula` varchar(45) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `foto` varchar(100) DEFAULT '',
  `cargo` varchar(45) NOT NULL,
  `sueldoBase` decimal(10,2) NOT NULL,
  `horasExtras` int(11) NOT NULL DEFAULT 0,
  `departamento_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`cedula`),
  KEY `fk_empleados_departamentos` (`departamento_id`),
  CONSTRAINT `fk_empleados_departamentos` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `empleados` (`cedula`, `nombre`, `foto`, `cargo`, `sueldoBase`, `horasExtras`, `departamento_id`) VALUES
	('V-122122112', 'Yoalice Muñoz', '', 'Manager', 156000.00, 30, 2),
	('V-1882828', 'Roberth Idrobo', 'foto-1783802514282-908495399.jpg', 'Servicios Generales', 1000.00, 10, 4),
	('V-26626262', 'Claudia Montilla', 'foto-1783799137802-829544323.jpeg', 'Dev FullStack', 15000.00, 5, 1),
	('V-32117825', 'Sebastian Briceño', 'foto-1788912023744-901208485.jpg', 'Dev Backend', 18000.00, 15, 1);

-- 4. Tabla: nominas (Periodos de Pago)
CREATE TABLE IF NOT EXISTS `nominas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(60) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date NOT NULL,
  `fechaPago` date NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `nominas` (`id`, `periodo`, `fechaInicio`, `fechaFin`, `fechaPago`, `estado`) VALUES
	(1, '1ra Quincena Octubre 2026', '2026-10-01', '2026-10-15', '2026-10-15', 'Pagada');

-- 5. Tabla: recibos_pago (Detalle por Empleado)
CREATE TABLE IF NOT EXISTS `recibos_pago` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomina_id` int(11) NOT NULL,
  `empleado_cedula` varchar(45) NOT NULL,
  `diasTrabajados` int(11) NOT NULL DEFAULT 15,
  `sueldoQuincena` decimal(10,2) NOT NULL,
  `horasExtras` int(11) NOT NULL DEFAULT 0,
  `montoHorasExtras` decimal(10,2) NOT NULL DEFAULT 0.00,
  `bonificaciones` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deducciones` decimal(10,2) NOT NULL DEFAULT 0.00,
  `totalNeto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_recibos_nominas` (`nomina_id`),
  KEY `fk_recibos_empleados` (`empleado_cedula`),
  CONSTRAINT `fk_recibos_nominas` FOREIGN KEY (`nomina_id`) REFERENCES `nominas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_recibos_empleados` FOREIGN KEY (`empleado_cedula`) REFERENCES `empleados` (`cedula`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `recibos_pago` (`id`, `nomina_id`, `empleado_cedula`, `diasTrabajados`, `sueldoQuincena`, `horasExtras`, `montoHorasExtras`, `bonificaciones`, `deducciones`, `totalNeto`) VALUES
	(1, 1, 'V-122122112', 15, 78000.00, 30, 29250.00, 250.00, 3900.00, 103600.00),
	(2, 1, 'V-1882828', 15, 500.00, 10, 62.50, 250.00, 25.00, 787.50),
	(3, 1, 'V-26626262', 15, 7500.00, 5, 468.75, 250.00, 375.00, 7843.75),
	(4, 1, 'V-32117825', 15, 9000.00, 15, 1687.50, 250.00, 450.00, 10487.50);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
