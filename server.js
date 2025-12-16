// =====================
// CONFIGURACIÓN INICIAL
// =====================
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// =====================
// MIDDLEWARES
// =====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'secreto_recetas',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

function rolesPermitidos(...roles){
  return (req,res,next)=>{
    if(req.session.usuario && roles.includes(req.session.usuario.rol)){
      next();
    }else{
      res.status(403).send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>403 | Acceso denegado</title>
<style>
  body{
    font-family:Segoe UI, sans-serif;
    background:#f6f7f9;
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
  }
  .box{
    background:#fff;
    padding:2.5rem 3rem;
    border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.15);
    text-align:center;
  }
  h1{
    color:#8b1e1e;
    font-weight:300;
    letter-spacing:3px;
  }
  p{
    color:#555;
    margin:1rem 0 2rem;
  }
  a{
    display:inline-block;
    padding:.6rem 1.4rem;
    border-radius:14px;
    background:#8b1e1e;
    color:#fff;
    text-decoration:none;
    font-weight:600;
  }
</style>
</head>
<body>
  <div class="box">
    <h1>403</h1>
    <p>No tienes permisos para acceder a esta sección.</p>
    <a href="/">Volver al inicio</a>
  </div>
</body>
</html>
`);

    }
  };
}

// =====================
// CONEXIÓN A MYSQL
// =====================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error(' Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

// =====================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================
function autenticado(req, res, next) {
  if (req.session.usuario) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

function soloRol(rol) {
  return (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === rol) {
      next();
    } else {
      res.status(403).send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>403 | Acceso denegado</title>
<style>
  body{
    font-family:Segoe UI, sans-serif;
    background:#f6f7f9;
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
  }
  .box{
    background:#fff;
    padding:2.5rem 3rem;
    border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.15);
    text-align:center;
  }
  h1{
    color:#8b1e1e;
    font-weight:300;
    letter-spacing:3px;
  }
  p{
    color:#555;
    margin:1rem 0 2rem;
  }
  a{
    display:inline-block;
    padding:.6rem 1.4rem;
    border-radius:14px;
    background:#8b1e1e;
    color:#fff;
    text-decoration:none;
    font-weight:600;
  }
</style>
</head>
<body>
  <div class="box">
    <h1>403</h1>
    <p>No tienes permisos para acceder a esta sección.</p>
    <a href="/">Volver al inicio</a>
  </div>
</body>
</html>
`);

    }
  };
}

// =====================
// RUTAS PRINCIPALES
// =====================
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// =====================
// REGISTRO
// =====================
app.post('/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
   return res.status(400).send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Error | Faltan datos</title>
<style>
  body{
    font-family:"Segoe UI", sans-serif;
    background:linear-gradient(135deg,#ffffff,#f1f2f4);
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
    margin:0;
  }
  .box{
    background:#fff;
    padding:2.8rem 3.2rem;
    border-radius:20px;
    box-shadow:0 20px 50px rgba(0,0,0,.2);
    text-align:center;
    max-width:420px;
    width:100%;
  }
  h1{
    font-weight:300;
    letter-spacing:3px;
    color:#8b1e1e;
    margin-bottom:1rem;
  }
  p{
    color:#555;
    margin-bottom:2rem;
    font-size:1.05rem;
  }
  .actions{
    display:flex;
    justify-content:center;
    gap:1rem;
  }
  a{
    padding:.7rem 1.6rem;
    border-radius:14px;
    text-decoration:none;
    font-weight:600;
    transition:transform .2s, box-shadow .2s;
  }
  .btn-primary{
    background:#8b1e1e;
    color:#fff;
    box-shadow:0 6px 18px rgba(139,30,30,.35);
  }
  .btn-secondary{
    background:#f1f1f1;
    color:#333;
  }
  a:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 25px rgba(0,0,0,.2);
  }
</style>
</head>
<body>

  <div class="box">
    <h1>❌ Error</h1>
    <p>Faltan datos obligatorios. Por favor completa todos los campos.</p>

    <div class="actions">
      <a href="/register.html" class="btn-primary">Volver al registro</a>
      <a href="javascript:history.back()" class="btn-secondary">Regresar</a>
    </div>
  </div>

</body>
</html>
`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const sqlUsuario = `
    INSERT INTO usuarios (nombre, email, password, rol)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sqlUsuario, [nombre, email, passwordHash, rol], (err, result) => {
    if (err) {
      console.error(err);
return res.status(500).send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Error | Registro</title>
<style>
  body{
    font-family:"Segoe UI", sans-serif;
    background:linear-gradient(135deg,#ffffff,#f1f2f4);
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
    margin:0;
  }
  .box{
    background:#fff;
    padding:2.8rem 3.2rem;
    border-radius:20px;
    box-shadow:0 20px 50px rgba(0,0,0,.2);
    text-align:center;
    max-width:430px;
    width:100%;
  }
  h1{
    font-weight:300;
    letter-spacing:3px;
    color:#8b1e1e;
    margin-bottom:1rem;
  }
  p{
    color:#555;
    margin-bottom:2rem;
    font-size:1.05rem;
  }
  .actions{
    display:flex;
    justify-content:center;
    gap:1rem;
    flex-wrap:wrap;
  }
  a{
    padding:.7rem 1.6rem;
    border-radius:14px;
    text-decoration:none;
    font-weight:600;
    transition:transform .2s, box-shadow .2s;
  }
  .btn-primary{
    background:#8b1e1e;
    color:#fff;
    box-shadow:0 6px 18px rgba(139,30,30,.35);
  }
  .btn-secondary{
    background:#f1f1f1;
    color:#333;
  }
  a:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 25px rgba(0,0,0,.2);
  }
</style>
</head>
<body>

  <div class="box">
    <h1>❌ Registro fallido</h1>
    <p>Ocurrió un error al registrar el usuario.<br>
       Intenta nuevamente o revisa los datos ingresados.</p>

    <div class="actions">
      <a href="/register.html" class="btn-primary">Volver al registro</a>
      <a href="javascript:history.back()" class="btn-secondary">Regresar</a>
    </div>
  </div>

</body>
</html>
`);

    }

    const idUsuario = result.insertId;

    if (rol === 'paciente') {
      db.query(
        'INSERT INTO pacientes (id_usuario) VALUES (?)',
        [idUsuario]
      );
    }

    if (rol === 'medico') {
      db.query(
        'INSERT INTO medicos (id_usuario) VALUES (?)',
        [idUsuario]
      );
    }

  return res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Registro exitoso</title>
<style>
  body{
    margin:0;
    height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    background:#f6f7f9;
    font-family:"Segoe UI",sans-serif;
  }
  .card{
    background:#fff;
    padding:2.5rem 3rem;
    border-radius:20px;
    box-shadow:0 20px 40px rgba(0,0,0,.12);
    text-align:center;
    max-width:420px;
  }
  h1{
    color:#2ecc71;
    margin-bottom:1rem;
    font-weight:600;
  }
  p{
    color:#444;
    margin-bottom:2rem;
  }
  .btn{
    display:inline-block;
    padding:.7rem 1.6rem;
    border-radius:14px;
    text-decoration:none;
    font-weight:700;
    margin:0 .3rem;
  }
  .login{
    background:#2ecc71;
    color:#fff;
  }
  .register{
    background:#8b1e1e;
    color:#fff;
  }
</style>
</head>
<body>

<div class="card">
  <h1>✅ Registro exitoso</h1>
  <p>El usuario fue creado correctamente en el sistema.</p>

  <a href="/login.html" class="btn login">Iniciar sesión</a>
  <a href="/register.html" class="btn register">Registrar otro</a>
</div>

</body>
</html>
`);

  });
});

// =====================
// LOGIN
// =====================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM usuarios WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
    return res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Usuario no encontrado</title>
  <style>
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#f6f7f9;
      font-family:"Segoe UI",sans-serif;
    }
    .box{
      background:#fff;
      padding:2.5rem 3rem;
      border-radius:20px;
      box-shadow:0 15px 40px rgba(0,0,0,.1);
      text-align:center;
      max-width:420px;
    }
    h1{
      color:#b71c1c;
      font-weight:600;
      margin-bottom:1rem;
    }
    p{
      color:#444;
      margin-bottom:2rem;
    }
    a{
      display:inline-block;
      padding:0.7rem 1.6rem;
      background:#b71c1c;
      color:#fff;
      border-radius:14px;
      text-decoration:none;
      font-weight:600;
      transition:.2s;
    }
    a:hover{
      background:#8b1e1e;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>❌ Usuario no encontrado</h1>
    <p>El correo ingresado no está registrado en el sistema.</p>
    <a href="/login.html">Volver al inicio de sesión</a>
  </div>
</body>
</html>
`);

    }

    const usuario = results[0];
    const valido = await bcrypt.compare(password, usuario.password);

    if (!valido) {
    return res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contraseña incorrecta</title>
  <style>
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#f6f7f9;
      font-family:"Segoe UI",sans-serif;
    }
    .box{
      background:#fff;
      padding:2.5rem 3rem;
      border-radius:20px;
      box-shadow:0 15px 40px rgba(0,0,0,.1);
      text-align:center;
      max-width:420px;
    }
    h1{
      color:#d32f2f;
      font-weight:600;
      margin-bottom:1rem;
    }
    p{
      color:#444;
      margin-bottom:2rem;
      line-height:1.5;
    }
    a{
      display:inline-block;
      padding:0.7rem 1.6rem;
      background:#d32f2f;
      color:#fff;
      border-radius:14px;
      text-decoration:none;
      font-weight:600;
      transition:.2s;
    }
    a:hover{
      background:#b71c1c;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>❌ Contraseña incorrecta</h1>
    <p>La contraseña ingresada no es correcta.<br>
       Por favor, verifica e inténtalo nuevamente.</p>
    <a href="/login.html">Volver a intentar</a>
  </div>
</body>
</html>
`);

    }

    req.session.usuario = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      rol: usuario.rol
    };

    // Redirección por rol
    if (usuario.rol === 'medico') res.redirect('/medico.html');
    else if (usuario.rol === 'farmacia') res.redirect('/farmacia.html');
    else if (usuario.rol === 'paciente') res.redirect('/paciente.html');
    else res.redirect('/admin.html');
  });
});

// =====================
// LOGOUT
// =====================
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// =====================
// SERVIDOR
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// LISTAR USUARIOS
app.get('/admin/usuarios', (req,res)=>{
  db.query('SELECT id_usuario,nombre,email,rol FROM usuarios',(err,rows)=>{
    if(err) return res.status(500).json(err);
    res.json(rows);
  });
});

// ACTUALIZAR USUARIO
app.post('/admin/usuarios/actualizar',(req,res)=>{
  const {id_usuario,nombre,email,rol} = req.body;

  db.query(
    'UPDATE usuarios SET nombre=?, email=?, rol=? WHERE id_usuario=?',
    [nombre,email,rol,id_usuario],
    err=>{
      if(err) return res.status(500).json(err);
      res.sendStatus(200);
    }
  );
});

// ELIMINAR USUARIO
app.post('/admin/usuarios/eliminar', (req, res) => {
  const { id_usuario } = req.body;

  // Verificar dependencias
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM pacientes WHERE id_usuario = ?) +
      (SELECT COUNT(*) FROM medicos WHERE id_usuario = ?) AS total
  `;

  db.query(sql, [id_usuario, id_usuario], (err, rows) => {
    if (err) return res.status(500).send('Error interno');

    if (rows[0].total > 0) {
      return res.status(400).send('No se puede eliminar: usuario con registros asociados');
    }

    db.query(
      'DELETE FROM usuarios WHERE id_usuario = ?',
      [id_usuario],
      err => {
        if (err) return res.status(500).send('Error al eliminar');
        res.sendStatus(200);
      }
    );
  });
});



// LISTAR PACIENTES
app.get('/medico/pacientes',(req,res)=>{
  db.query(`
    SELECT p.id_paciente, u.nombre
    FROM pacientes p
    JOIN usuarios u ON p.id_usuario = u.id_usuario
  `,(err,rows)=>{
    if(err) return res.sendStatus(500);
    res.json(rows);
  });
});

app.post('/medico/receta', autenticado, soloRol('medico'), (req, res) => {
  const { paciente, diagnostico, medicamentos } = req.body;
  const id_usuario = req.session.usuario.id;

  // 1️⃣ Obtener id_medico desde la BD
  db.query(
    'SELECT id_medico FROM medicos WHERE id_usuario = ?',
    [id_usuario],
    (err, rows) => {
      if (err || rows.length === 0) return res.sendStatus(500);

      const id_medico = rows[0].id_medico;

      // 2️⃣ Insertar receta
      db.query(
        'INSERT INTO recetas (id_paciente, id_medico, diagnostico, estado) VALUES (?,?,?, "pendiente")',
        [paciente, id_medico, diagnostico],
        (err, result) => {
          if (err) return res.sendStatus(500);

          const id_receta = result.insertId;

          // 3️⃣ Medicamentos
          medicamentos.forEach(m => {
            db.query(
              'INSERT INTO medicamentos (nombre) VALUES (?)',
              [m.nombre],
              (err, r) => {
                const id_medicamento = r.insertId;
                db.query(
                  `INSERT INTO receta_medicamentos
                   (id_receta, id_medicamento, dosis, frecuencia, duracion)
                   VALUES (?,?,?,?,?)`,
                  [id_receta, id_medicamento, m.dosis, m.frecuencia, m.duracion]
                );
              }
            );
          });

          res.sendStatus(200);
        }
      );
    }
  );
});



//RECETA PDF
app.post('/farmacia/entregar/:id', autenticado, soloRol('farmacia'), (req,res)=>{
  db.query(
    'UPDATE recetas SET estado = "entregada" WHERE id_receta = ?',
    [req.params.id],
    err=>{
      if(err) return res.sendStatus(500);
      res.sendStatus(200);
    }
  );
});

app.get(
  '/receta/:id/pdf',
  autenticado,
  rolesPermitidos('farmacia','paciente'),
  (req,res)=>{

    const sqlReceta = `
      SELECT 
        r.id_receta,
        r.fecha_receta,
        r.diagnostico,
        up.nombre AS paciente,
        um.nombre AS medico
      FROM recetas r
      JOIN pacientes p ON r.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN medicos m ON r.id_medico = m.id_medico
      JOIN usuarios um ON m.id_usuario = um.id_usuario
      WHERE r.id_receta = ?
    `;

    const sqlMeds = `
      SELECT 
        m.nombre,
        rm.dosis,
        rm.frecuencia,
        rm.duracion
      FROM receta_medicamentos rm
      JOIN medicamentos m ON rm.id_medicamento = m.id_medicamento
      WHERE rm.id_receta = ?
    `;

    db.query(sqlReceta,[req.params.id],(err,recetas)=>{
      if(err || recetas.length===0) return res.sendStatus(404);

      db.query(sqlMeds,[req.params.id],(err,meds)=>{
        if(err) return res.sendStatus(500);

        generarPDF(res, recetas[0], meds);
      });
    });
});

app.get('/farmacia/recetas', autenticado, soloRol('farmacia'), (req,res)=>{
  const sql = `
    SELECT 
      r.id_receta,
      r.fecha_receta,
      up.nombre AS nombre_paciente,
      um.nombre AS nombre_medico
    FROM recetas r
    JOIN pacientes p ON r.id_paciente = p.id_paciente
    JOIN usuarios up ON p.id_usuario = up.id_usuario
    JOIN medicos m ON r.id_medico = m.id_medico
    JOIN usuarios um ON m.id_usuario = um.id_usuario
    WHERE r.estado = 'pendiente'
  `;
  db.query(sql,(err,rows)=>{
    if(err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get('/paciente/recetas', autenticado, soloRol('paciente'), (req,res)=>{
  const sql = `
    SELECT 
      r.id_receta,
      r.fecha_receta,
      r.estado,
      um.nombre AS medico
    FROM recetas r
    JOIN medicos m ON r.id_medico = m.id_medico
    JOIN usuarios um ON m.id_usuario = um.id_usuario
    JOIN pacientes p ON r.id_paciente = p.id_paciente
    WHERE p.id_usuario = ?
    ORDER BY r.fecha_receta DESC
  `;

  db.query(sql,[req.session.usuario.id],(err,rows)=>{
    if(err) return res.status(500).json(err);
    res.json(rows);
  });
});

function generarPDF(res, receta, medicamentos){
  const doc = new PDFDocument({ margin:50 });

  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','inline; filename=receta.pdf');

  doc.pipe(res);

  /* ===== LOGO ===== */
  const logoPath = path.join(__dirname,'public','logomed.png');
  if(fs.existsSync(logoPath)){
    doc.image(logoPath,50,40,{ width:80 });
  }

  doc
    .fontSize(20)
    .fillColor('#1e8f5a')
    .text('RECETA MÉDICA',150,50);

  doc.moveDown(2);

  /* ===== DATOS ===== */
  doc.fontSize(11).fillColor('#000');
  doc.text(`Paciente: ${receta.paciente}`);
  doc.text(`Médico: ${receta.medico}`);
  doc.text(`Fecha: ${new Date(receta.fecha_receta).toLocaleString()}`);

  doc.moveDown();

  /* ===== DIAGNÓSTICO ===== */
  doc
    .fontSize(12)
    .fillColor('#1e8f5a')
    .text('Diagnóstico');

  doc
    .moveDown(0.5)
    .fontSize(10)
    .fillColor('#000')
    .text(receta.diagnostico,{
      align:'justify'
    });

  doc.moveDown(1.5);

  /* ===== TABLA MEDICAMENTOS ===== */
  doc
    .fontSize(12)
    .fillColor('#1e8f5a')
    .text('Medicamentos');

  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colX = [50, 220, 320, 420];

  // Encabezados
  doc
    .fontSize(10)
    .fillColor('#fff')
    .rect(50, tableTop, 500, 20)
    .fill('#1e8f5a');

  doc.fillColor('#fff');
  doc.text('Medicamento', colX[0], tableTop+5);
  doc.text('Dosis', colX[1], tableTop+5);
  doc.text('Frecuencia', colX[2], tableTop+5);
  doc.text('Duración', colX[3], tableTop+5);

  let y = tableTop + 25;

  doc.fillColor('#000');

  medicamentos.forEach((m,i)=>{
    if(i % 2 === 0){
      doc.rect(50,y-2,500,18).fill('#f2fff8');
      doc.fillColor('#000');
    }

    doc.text(m.nombre, colX[0], y);
    doc.text(m.dosis, colX[1], y);
    doc.text(m.frecuencia, colX[2], y);
    doc.text(m.duracion, colX[3], y);

    y += 20;
  });

  doc.moveDown(4);

  /* ===== FIRMA ===== */
  doc
    .moveTo(350, y+40)
    .lineTo(550, y+40)
    .stroke();

  doc
    .fontSize(10)
    .text(`Firma del médico`, 400, y+45);

  doc.end();
}

// DASHBOARD PACIENTE
app.get('/paciente/dashboard', autenticado, soloRol('paciente'), (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(estado = 'pendiente') AS pendientes,
      SUM(estado = 'entregada') AS entregadas,
      MAX(fecha_receta) AS ultima
    FROM recetas r
    JOIN pacientes p ON r.id_paciente = p.id_paciente
    WHERE p.id_usuario = ?
  `;

  db.query(sql, [req.session.usuario.id], (err, rows) => {
    if (err) return res.sendStatus(500);
    res.json(rows[0]);
  });
});

app.get('/paciente/info', autenticado, soloRol('paciente'), (req, res) => {
  res.json({
    nombre: req.session.usuario.nombre
  });
});

// OBTENER PERFIL PACIENTE
app.get('/paciente/perfil', autenticado, soloRol('paciente'), (req,res)=>{
  const sql = `
    SELECT 
      u.nombre,
      u.email,
      p.telefono,
      p.fecha_nacimiento,
      p.sexo,
      u.creado_en
    FROM usuarios u
    JOIN pacientes p ON u.id_usuario = p.id_usuario
    WHERE u.id_usuario = ?
  `;

  db.query(sql, [req.session.usuario.id], (err, rows)=>{
    if(err || rows.length === 0){
      return res.sendStatus(500);
    }
    res.json(rows[0]);
  });
});

// ACTUALIZAR PERFIL PACIENTE 
app.post('/paciente/perfil', autenticado, soloRol('paciente'), (req,res)=>{
  const { telefono, fecha_nacimiento, sexo } = req.body;

  const sql = `
    UPDATE pacientes 
    SET telefono = ?, fecha_nacimiento = ?, sexo = ?
    WHERE id_usuario = ?
  `;

  db.query(
    sql,
    [telefono, fecha_nacimiento, sexo, req.session.usuario.id],
    err=>{
      if(err) return res.sendStatus(500);
      res.sendStatus(200);
    }
  );
});

// =====================
// HISTORIAL MÉDICO PACIENTE
// =====================
app.get('/paciente/historial', autenticado, soloRol('paciente'), (req, res) => {

  const sql = `
    SELECT
      r.id_receta,
      r.fecha_receta,
      r.diagnostico,
      r.estado,
      um.nombre AS medico
    FROM recetas r
    JOIN pacientes p ON r.id_paciente = p.id_paciente
    JOIN medicos m ON r.id_medico = m.id_medico
    JOIN usuarios um ON m.id_usuario = um.id_usuario
    WHERE p.id_usuario = ?
    ORDER BY r.fecha_receta DESC
  `;

  db.query(sql, [req.session.usuario.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

// DASHBOARD FARMACIA (FIX REAL)
app.get('/farmacia/dashboard', autenticado, soloRol('farmacia'), (req,res)=>{
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
      SUM(
        CASE 
          WHEN estado = 'entregada' 
          AND DATE(fecha_receta) = CURDATE()
          THEN 1 ELSE 0 
        END
      ) AS entregadas_hoy,
      MAX(
        CASE 
          WHEN estado = 'entregada' 
          THEN fecha_receta 
          ELSE NULL 
        END
      ) AS ultima_entrega
    FROM recetas
  `;

  db.query(sql,(err,rows)=>{
    if(err){
      console.error(err);
      return res.status(500).json({});
    }
    res.json(rows[0]);
  });
});

app.get('/farmacia/recetas/buscar', autenticado, soloRol('farmacia'), (req,res)=>{
  const q = `%${req.query.q || ''}%`;

  const sql = `
    SELECT 
      r.id_receta,
      r.fecha_receta,
      up.nombre AS nombre_paciente,
      um.nombre AS nombre_medico
    FROM recetas r
    JOIN pacientes p ON r.id_paciente = p.id_paciente
    JOIN usuarios up ON p.id_usuario = up.id_usuario
    JOIN medicos m ON r.id_medico = m.id_medico
    JOIN usuarios um ON m.id_usuario = um.id_usuario
    WHERE r.estado = 'pendiente'
    AND (up.nombre LIKE ? OR um.nombre LIKE ?)
  `;

  db.query(sql,[q,q],(err,rows)=>{
    if(err) return res.status(500).json([]);
    res.json(rows);
  });
});

// =====================
// HISTORIAL FARMACIA
// =====================
app.get('/farmacia/historial', autenticado, soloRol('farmacia'), (req,res)=>{
  const sql = `
    SELECT
      r.id_receta,
      r.fecha_receta,
      up.nombre AS paciente,
      um.nombre AS medico
    FROM recetas r
    JOIN pacientes p ON r.id_paciente = p.id_paciente
    JOIN usuarios up ON p.id_usuario = up.id_usuario
    JOIN medicos m ON r.id_medico = m.id_medico
    JOIN usuarios um ON m.id_usuario = um.id_usuario
    WHERE r.estado = 'entregada'
    ORDER BY r.fecha_receta DESC
  `;

  db.query(sql,(err,rows)=>{
    if(err){
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

app.get('/medico/pacientes', autenticado, soloRol('medico'), (req,res)=>{
  db.query(`
    SELECT p.id_paciente, u.nombre
    FROM pacientes p
    JOIN usuarios u ON p.id_usuario = u.id_usuario
  `,(err,rows)=>{
    if(err) return res.status(500).json([]);
    res.json(rows);
  });
});

app.post('/medico/receta', autenticado, soloRol('medico'), (req, res) => {
  const { paciente, diagnostico, medicamentos } = req.body;
  const id_usuario = req.session.usuario.id;

  db.query(
    'SELECT id_medico FROM medicos WHERE id_usuario = ?',
    [id_usuario],
    (err, rows) => {
      if (err || rows.length === 0) return res.sendStatus(500);

      const id_medico = rows[0].id_medico;

      db.query(
        'INSERT INTO recetas (id_paciente, id_medico, diagnostico, estado) VALUES (?,?,?, "pendiente")',
        [paciente, id_medico, diagnostico],
        (err, result) => {
          if (err) return res.sendStatus(500);

          const id_receta = result.insertId;

          medicamentos.forEach(m => {
            db.query(
              'INSERT INTO medicamentos (nombre) VALUES (?)',
              [m.nombre],
              (err, r) => {
                if(err) return;
                db.query(
                  `INSERT INTO receta_medicamentos
                   (id_receta, id_medicamento, dosis, frecuencia, duracion)
                   VALUES (?,?,?,?,?)`,
                  [id_receta, r.insertId, m.dosis, m.frecuencia, m.duracion]
                );
              }
            );
          });

          res.sendStatus(200);
        }
      );
    }
  );
});

const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.get('/admin/medicamentos', (req,res)=>{
  db.query(
    'SELECT id_medicamento, nombre FROM medicamentos ORDER BY nombre',
    (err,rows)=>{
      if(err) return res.status(500).json([]);
      res.json(rows);
    }
  );
});

app.post(
  '/admin/medicamentos/importar',
  upload.single('excel'),
  async (req,res)=>{
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);

    const ws = wb.worksheets[0];

    for(let i=2;i<=ws.rowCount;i++){
      const nombre = ws.getRow(i).getCell(2).value;

      if(!nombre) continue;

      await db.promise().query(
        'INSERT IGNORE INTO medicamentos (nombre) VALUES (?)',
        [nombre.toString()]
      );
    }

    fs.unlinkSync(req.file.path);
    res.sendStatus(200);
  }
);

app.get('/admin/medicamentos/excel', async (req, res) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema de Recetas';
  wb.created = new Date();

  const ws = wb.addWorksheet('Medicamentos', {
    views: [{ state: 'frozen', ySplit: 1 }] // congelar encabezado
  });

  // ===== COLUMNAS =====
  ws.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre del medicamento', key: 'nombre', width: 40 }
  ];

  // ===== ESTILO ENCABEZADOS =====
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B1E1E' } // rojo elegante
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // ===== DATOS =====
  const [rows] = await db.promise().query(
    'SELECT id_medicamento AS id, nombre FROM medicamentos'
  );

  rows.forEach((r, index) => {
    const row = ws.addRow(r);

    // zebra (filas alternadas)
    if (index % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF6F7F9' }
        };
      });
    }

    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
  });

  // ===== FILTRO =====
  ws.autoFilter = 'A1:B1';

  // ===== RESPUESTA =====
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=Medicamentos.xlsx'
  );

  await wb.xlsx.write(res);
  res.end();
});
