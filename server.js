
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

// Carpeta donde se guardan los expedientes
const carpetaExpedientes = path.join(__dirname, "data", "expedientes");

app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor SIGO-GN funcionando correctamente");
});

// GET - Consultar todos los expedientes
app.get("/expedientes", (req, res) => {

  const archivos = fs.readdirSync(carpetaExpedientes);

  const expedientes = archivos
    .filter(archivo => archivo.endsWith(".json"))
    .map(archivo => {

      const ruta = path.join(carpetaExpedientes, archivo);
      const contenido = fs.readFileSync(ruta, "utf8");

      return JSON.parse(contenido);
    });

  res.json(expedientes);
});

// POST - Crear un expediente
app.post("/expedientes", (req, res) => {

  const expediente = req.body;

  const archivos = fs.readdirSync(carpetaExpedientes)
    .filter(archivo => archivo.endsWith(".json"));

  const numeros = archivos.map(archivo => {
    const coincidencia = archivo.match(/^EXP-0480-(\d+)\.json$/);
    return coincidencia ? Number(coincidencia[1]) : 0;
  });

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

  if (!/^EXP-0480-\d{3,}$/.test(folio)) {
    return res.status(400).json({
      mensaje: "Folio no valido"
    });
  }

  const ruta = path.join(carpetaExpedientes, folio + ".json");

  if (!fs.existsSync(ruta)) {
    return res.status(404).json({
      mensaje: "Expediente no encontrado"
    });
  }

  const contenido = fs.readFileSync(ruta, "utf8");

  res.json(JSON.parse(contenido));
});

 // PUT - Modificar un expediente
app.put("/expedientes/:folio", (req, res) => {

  const folio = req.params.folio;

  // Comprobar el formato del folio
  if (!/^EXP-0480-\d{3,}$/.test(folio)) {
    return res.status(400).json({
      mensaje: "Folio no valido"
    });
  }

  // Buscar el archivo
  const ruta = path.join(carpetaExpedientes, folio + ".json");

  // Verificar si existe
  if (!fs.existsSync(ruta)) {
    return res.status(404).json({
      mensaje: "Expediente no encontrado"
    });
  }

  // Leer los datos anteriores
  const anterior = JSON.parse(fs.readFileSync(ruta, "utf8"));

  // Actualizar la informacion
  const actualizado = {
    ...anterior,
    ...req.body,
    folio: folio
  };

  // Guardar los cambios en el mismo archivo
  fs.writeFileSync(
    ruta,
    JSON.stringify(actualizado, null, 2)
  );

  res.json({
    mensaje: "Expediente actualizado correctamente",
    expediente: actualizado
  });

});

 // DELETE - Eliminar un expediente
app.delete("/expedientes/:folio", (req, res) => {

  // Obtener el folio
  const folio = req.params.folio;

  // Verificar el formato del folio
  if (!/^EXP-0480-\d{3,}$/.test(folio)) {
    return res.status(400).json({
      mensaje: "Folio no valido"
    });
  }

  // Buscar el archivo
  const ruta = path.join(carpetaExpedientes, folio + ".json");

  // Comprobar si existe
  if (!fs.existsSync(ruta)) {
    return res.status(404).json({
      mensaje: "Expediente no encontrado"
    });
  }

  // Eliminar el archivo JSON
  fs.unlinkSync(ruta);

  // Enviar una respuesta
  res.json({
    mensaje: "Expediente eliminado correctamente"
  });

});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log("Servidor funcionando en http://localhost:4000");
});
