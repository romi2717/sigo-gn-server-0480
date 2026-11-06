
const fs = require("fs");
const path = require("path");

const carpeta = path.join(__dirname, "data", "expedientes");

// Datos para los expedientes nuevos
const datosNuevos = [
  ["Operativo de seguridad vial", "Accidente", "Zona Norte", "Alta", "Abierto"],
  ["Operativo comunitario", "Prevencion", "Zona Centro", "Media", "En proceso"],
  ["Operativo de vigilancia escolar", "Seguridad", "Zona Oriente", "Baja", "Cerrado"],
  ["Operativo de transporte", "Incidente vial", "Zona Sur", "Alta", "En proceso"],
  ["Operativo de patrullaje", "Robo", "Zona Poniente", "Alta", "Abierto"],
  ["Operativo de proteccion civil", "Simulacro", "Zona Centro", "Baja", "Cerrado"],
  ["Operativo de seguridad publica", "Reporte ciudadano", "Zona Norte", "Media", "En proceso"],
  ["Operativo de revision", "Inspeccion", "Zona Oriente", "Media", "Cerrado"],
  ["Operativo de apoyo ciudadano", "Emergencia", "Zona Sur", "Alta", "Abierto"],
  ["Operativo de prevencion", "Seguridad", "Zona Poniente", "Baja", "Cerrado"]
];

// Completar los 5 expedientes existentes
for (let i = 1; i <= 5; i++) {
  const folio = "EXP-0480-" + String(i).padStart(3, "0");
  const ruta = path.join(carpeta, folio + ".json");

  if (!fs.existsSync(ruta)) {
    console.log("No se encontro:", folio);
    continue;
  }

  const expediente = JSON.parse(fs.readFileSync(ruta, "utf8"));

  const estatus = ["Abierto", "En proceso", "Cerrado"];
  const prioridades = ["Alta", "Media", "Baja"];

  if (!expediente.estatus) {
    expediente.estatus = estatus[(i - 1) % 3];
  }

  if (!expediente.prioridad) {
    expediente.prioridad = prioridades[(i - 1) % 3];
  }

  if (!expediente.fechaCreacion) {
    expediente.fechaCreacion =
      new Date(2026, 9, 20 + i, 10, 0).toISOString();
  }

  if (!expediente.fechaModificacion) {
    expediente.fechaModificacion = expediente.fechaCreacion;
  }

  fs.writeFileSync(ruta, JSON.stringify(expediente, null, 2));

  console.log("Actualizado:", folio);
}

// Crear los expedientes del 006 al 015
for (let i = 6; i <= 15; i++) {
  const folio = "EXP-0480-" + String(i).padStart(3, "0");
  const ruta = path.join(carpeta, folio + ".json");

  // Evitar reemplazar archivos existentes
  if (fs.existsSync(ruta)) {
    console.log("Ya existe:", folio);
    continue;
  }

  const datos = datosNuevos[i - 6];

  const fechaCreacion =
    new Date(2026, 9, 20 + i, 10, 0).toISOString();

  const expediente = {
    folio: folio,
    nombreOperativo: datos[0],
    tipoIncidente: datos[1],
    zona: datos[2],
    fecha: "2026-11-" + String(i).padStart(2, "0"),
    descripcion: "Registro de prueba del " + datos[0].toLowerCase() + ".",
    estatus: datos[4],
    prioridad: datos[3],
    fechaCreacion: fechaCreacion,
    fechaModificacion: fechaCreacion
  };

  fs.writeFileSync(ruta, JSON.stringify(expediente, null, 2));

  console.log("Creado:", folio);
}

console.log("Proceso terminado.");
