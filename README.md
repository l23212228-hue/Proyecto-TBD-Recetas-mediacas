# Proyecto-TBD-Recetas-mediacas
Sistema de gestion de recetas medicas con interfaz para admin, medicos, farmacia y pacientes 

# Creacion de base de datos

Crear un nuevo usuario 
``` sql
CREATE USER 'recetas_user'@'localhost' IDENTIFIED BY 'password_seguro';
```

Asignar privilegios
``` sql
GRANT SELECT, INSERT, UPDATE, DELETE
ON sistema_recetas.*
TO 'recetas_user'@'localhost';

FLUSH PRIVILEGES;
```

Crear base de datos
``` sql
CREATE DATABASE sistema_recetas
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```

Tabla de usuarios, medicamentos, pacientes, medicos, recetas, medicamentos, recetas-medicamentos

``` sql
USE sistema_recetas;

mysql> CREATE TABLE usuarios (
id_usuario INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100),
email VARCHAR(100) UNIQUE,
password VARCHAR(255),
rol ENUM('admin','medico','farmacia','paciente'),
creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pacientes (
id_paciente INT AUTO_INCREMENT PRIMARY KEY,
id_usuario INT,
fecha_nacimiento DATE,
sexo VARCHAR(10),
telefono VARCHAR(15),
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE medicos (
id_medico INT AUTO_INCREMENT PRIMARY KEY,
id_usuario INT,
especialidad VARCHAR(100),
cedula VARCHAR(50),
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

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

CREATE TABLE medicamentos (
id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100),
descripcion TEXT
);

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
