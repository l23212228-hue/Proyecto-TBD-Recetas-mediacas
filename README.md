# Proyecto TBD – Sistema de Gestión de Recetas Médicas- Reyes Zamudio Mariant

Sistema web para la gestión integral de recetas médicas con diferentes roles: administrador, médico, farmacia y paciente.  
Permite la creación, administración y seguimiento de recetas médicas de forma digital.

---

## Objetivos del Proyecto

### Objetivo General
Desarrollar un sistema web que permita gestionar recetas médicas de manera eficiente, segura y organizada, utilizando una base de datos relacional.

### Objetivos Específicos
- Administrar usuarios con distintos roles.
- Registrar pacientes y médicos.
- Crear y consultar recetas médicas.
- Generar recetas en formato PDF.
- Administrar medicamentos mediante archivos Excel.
- Mantener historial de recetas por paciente y farmacia.

---

## Tecnologías Utilizadas

- Node.js
- Express
- MySQL
- HTML, CSS y JavaScript
- PDFKit
- ExcelJS
- Multer
- Dotenv

---

## Creación de la Base de Datos

### Crear usuario en MySQL

```sql
CREATE USER 'recetas_user'@'localhost' IDENTIFIED BY 'password_seguro';
```

### Asignar privilegios

```sql
GRANT SELECT, INSERT, UPDATE, DELETE
ON sistema_recetas.*
TO 'recetas_user'@'localhost';

FLUSH PRIVILEGES;
```

### Crear base de datos

```sql
CREATE DATABASE sistema_recetas
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```

---

## Estructura de la Base de Datos

```sql
USE sistema_recetas;
```

### Tabla usuarios

```sql
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol ENUM('admin','medico','farmacia','paciente'),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla pacientes

```sql
CREATE TABLE pacientes (
  id_paciente INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  fecha_nacimiento DATE,
  sexo VARCHAR(10),
  telefono VARCHAR(15),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```

### Tabla medicos

```sql
CREATE TABLE medicos (
  id_medico INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  especialidad VARCHAR(100),
  cedula VARCHAR(50),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```

### Tabla recetas

```sql
CREATE TABLE recetas (
  id_receta INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente INT,
  id_medico INT,
  diagnostico TEXT,
  fecha_receta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('pendiente','entregada') DEFAULT 'pendiente',
  FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
  FOREIGN KEY (id_medico) REFERENCES medicos(id_medico)
);
```

### Tabla medicamentos

```sql
CREATE TABLE medicamentos (
  id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  descripcion TEXT
);
```

### Tabla receta_medicamentos

```sql
CREATE TABLE receta_medicamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_receta INT,
  id_medicamento INT,
  dosis VARCHAR(50),
  frecuencia VARCHAR(50),
  duracion VARCHAR(50),
  FOREIGN KEY (id_receta) REFERENCES recetas(id_receta),
  FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);
```

---

## Instalación del Proyecto

### Inicializar proyecto Node.js

```bash
npm init -y
```

### Instalar dependencias principales

```bash
npm install express mysql2 dotenv
```

### Instalar dependencias adicionales

```bash
npm install pdfkit
npm install multer exceljs
```

### Dependencia de desarrollo (opcional)

```bash
npm install nodemon --save-dev
```

---

## Archivo de Configuración (.env)

```env
DB_HOST=localhost
DB_USER=recetas_user
DB_PASSWORD=password_seguro
DB_NAME=sistema_recetas
PORT=3000
```

---

## Ejecutar el Servidor

```bash
npm start
```

O en modo desarrollo:

```bash
npx nodemon server.js
```

---

## Funcionalidades del Sistema

- Gestión de usuarios por roles.
- Registro de pacientes y médicos.
- Creación de recetas médicas.
- Generación de recetas en PDF.
- Importación y exportación de medicamentos en Excel.
- Historial de recetas médicas.

---

## Estado del Proyecto

Proyecto académico desarrollado para la materia TBD.
