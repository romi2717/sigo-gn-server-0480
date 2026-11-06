
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

// Carpeta donde se guardan los expedientes
const carpetaExpedientes = path.join(
  __dirname,
  "data",
  "expedientes"
);

app.use(cors());
app.use(express.json());

// Crear carpeta si no existe
if (!fs.existsSync(carpetaExpedientes)) {
  fs.mkdirSync(carpetaExpedientes, { recursive: true });
}

// Roles y permisos octales
const permisosRoles = {
  Comandante: 7,
  Oficial: 6,
  Analista: 4
};

// Comprobar permisos con el operador &
function tienePermiso(rolUsuario, accionRequerida) {
  const permisos = permisosRoles[rolUsuario] || 0;

  return (permisos & accionRequerida) === accionRequerida;
}

// Validar el rol enviado por el frontend
function validarPermiso(accionRequerida) {
  return (req, res, next) => {
    const rol = req.headers["x-rol"];

    if (!tienePermiso(rol, accionRequerida)) {
      return res.status(403).json({
        mensaje: "Acceso prohibido: no tienes permiso"
      });
    }

    next();
  };
}

// Leer todos los expedientes
function obtenerExpedientes() {
  const archivos = fs.readdirSync(carpetaExpedientes);

  const expedientes = archivos
    .filter(archivo => archivo.endsWith(".json"))
    .map(archivo => {
      const ruta = path.join(carpetaExpedientes, archivo);
      const contenido = fs.readFileSync(ruta, "utf8");

      return JSON.parse(contenido);
    });

  return expedientes;
}

// Validar el folio
function folioValido(folio) {
  return /^EXP-0480-\d{3,}$/.test(folio);
}

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor SIGO-GN funcionando correctamente");
});

// GET - Consultar todos los expedientes
app.get("/expedientes", (req, res) => {
  const expedientes = obtenerExpedientes();

  res.json(expedientes);
});

// GET - Buscar expedientes
app.get("/expedientes/buscar", (req, res) => {
  const texto = String(req.query.texto || "").toLowerCase();

  const expedientes = obtenerExpedientes();

  const resultados = expedientes.filter(expediente => {
    const folio = String(
      expediente.folio || ""
    ).toLowerCase();

    const nombre = String(
      expediente.nombreOperativo || ""
    ).toLowerCase();

    const descripcion = String(
      expediente.descripcion || ""
    ).toLowerCase();

    return (
      folio.includes(texto) ||
      nombre.includes(texto) ||
      descripcion.includes(texto)
    );
  });

  res.json(resultados);
});

// POST - Registrar expediente
// Solo Comandante y Oficial pueden registrar
app.post("/expedientes", validarPermiso(2), (req, res) => {
  const estatusValidos = ["Abierto", "En proceso", "Cerrado"];
  const prioridadesValidas = ["Alta", "Media", "Baja"];

  const fechaActual = new Date().toISOString();

  const expediente = {
    nombreOperativo: req.body.nombreOperativo,
    tipoIncidente: req.body.tipoIncidente,
    zona: req.body.zona,
    fecha: req.body.fecha,
    descripcion: req.body.descripcion,

    estatus: estatusValidos.includes(req.body.estatus)
      ? req.body.estatus
      : "Abierto",

    prioridad: prioridadesValidas.includes(req.body.prioridad)
      ? req.body.prioridad
      : "Media",

    fechaCreacion: fechaActual,
    fechaModificacion: fechaActual
  };

  // Obtener folios existentes
  const archivos = fs.readdirSync(carpetaExpedientes)
    .filter(archivo => archivo.endsWith(".json"));

  const numeros = archivos.map(archivo => {
    const coincidencia = archivo.match(
      /^EXP-0480-(\d+)\.json$/
    );

    return coincidencia ? Number(coincidencia[1]) : 0;
  });

  // Generar siguiente folio
  const siguienteNumero = Math.max(0, ...numeros) + 1;

  expediente.folio = "EXP-0480-" +
    String(siguienteNumero).padStart(3, "0");

  const ruta = path.join(
    carpetaExpedientes,
    expediente.folio + ".json"
  );

  fs.writeFileSync(
    ruta,
    JSON.stringify(expediente, null, 2)
  );

  res.status(201).json(expediente);
});

// GET - Consultar un expediente por folio
app.get("/expedientes/:folio", (req, res) => {
  const folio = req.params.folio;

  if (!folioValido(folio)) {
    return res.status(400).json({
      mensaje: "Folio no valido"
    });
  }

  const ruta = path.join(
    carpetaExpedientes,
    folio + ".json"
  );

  if (!fs.existsSync(ruta)) {
    return res.status(404).json({
      mensaje: "Expediente no encontrado"
    });
  }

  const contenido = fs.readFileSync(ruta, "utf8");

  res.json(JSON.parse(contenido));
});

// PUT - Modificar expediente
// Requiere permiso de escritura (2)
app.put(
  "/expedientes/:folio",
  validarPermiso(2),
  (req, res) => {
    const folio = req.params.folio;

    if (!folioValido(folio)) {
      return res.status(400).json({
        mensaje: "Folio no valido"
      });
    }

    const ruta = path.join(
      carpetaExpedientes,
      folio + ".json"
    );

    if (!fs.existsSync(ruta)) {
      return res.status(404).json({
        mensaje: "Expediente no encontrado"
      });
    }

    // Leer datos anteriores
    const anterior = JSON.parse(
      fs.readFileSync(ruta, "utf8")
    );

    const estatusValidos = [
      "Abierto",
      "En proceso",
      "Cerrado"
    ];

    const prioridadesValidas = [
      "Alta",
      "Media",
      "Baja"
    ];

    const estatus = req.body.estatus === undefined
      ? (anterior.estatus || "Abierto")
      : req.body.estatus;

    const prioridad = req.body.prioridad === undefined
      ? (anterior.prioridad || "Media")
      : req.body.prioridad;

    if (
      !estatusValidos.includes(estatus) ||
      !prioridadesValidas.includes(prioridad)
    ) {
      return res.status(400).json({
        mensaje: "Estatus o prioridad no validos"
      });
    }

    // Actualizar expediente
    const actualizado = {
      ...anterior,
      ...req.body,
      folio: folio,
      estatus: estatus,
      prioridad: prioridad,
      fechaCreacion: anterior.fechaCreacion ||
        new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    fs.writeFileSync(
      ruta,
      JSON.stringify(actualizado, null, 2)
    );

    res.json({
      mensaje: "Expediente actualizado correctamente",
      expediente: actualizado
    });
  }
);

// DELETE - Eliminar expediente
// Requiere permiso de eliminacion (1)
app.delete(
  "/expedientes/:folio",
  validarPermiso(1),
  (req, res) => {
    const folio = req.params.folio;

    if (!folioValido(folio)) {
      return res.status(400).json({
        mensaje: "Folio no valido"
      });
    }

    const ruta = path.join(
      carpetaExpedientes,
      folio + ".json"
    );

    if (!fs.existsSync(ruta)) {
      return res.status(404).json({
        mensaje: "Expediente no encontrado"
      });
    }

    fs.unlinkSync(ruta);

    res.json({
      mensaje: "Expediente eliminado correctamente"
    });
  }
);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(
    "Servidor funcionando en http://localhost:4000"
  );
});
