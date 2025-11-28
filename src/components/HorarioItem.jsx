// HorarioItem.jsx
import React from "react";

export default function HorarioItem({
  fecha,
  hora,
  estado, // "DISPONIBLE" o "OCUPADO" — ahora viene del AdminPanel
  onEliminar,
  onOcupar,
  onLiberar
}) {

  const ocupado = estado === "OCUPADO";

  return (
    <div
      className={`px-3 py-1 rounded flex items-center gap-2 
        ${ocupado ? "bg-red-700" : "bg-green-700"}`}
    >
      <span>
        {hora} {ocupado ? "(OCUPADO)" : "(DISPONIBLE)"}
      </span>

      {/* Eliminar horario habilitado */}
      <button className="text-red-400" onClick={() => onEliminar(hora)}>
        ✕
      </button>

      {/* Ocupar / Liberar */}
      {!ocupado ? (
        <button
          className="text-yellow-300"
          onClick={() => onOcupar(fecha, hora)}
        >
          Ocupar
        </button>
      ) : (
        <button
          className="text-green-300"
          onClick={() => onLiberar(fecha, hora)}
        >
          Liberar
        </button>
      )}
    </div>
  );
}
