import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPanel() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [fechasConHorarios, setFechasConHorarios] = useState([]);
  const [editingId, setEditingId] = useState(null); // 👈 para detectar si estamos editando
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarFechas();
  }, []);

  // Cargar listado de fechas ya guardadas
  async function cargarFechas() {
    const { data } = await supabase
      .from("availability")
      .select("id, fecha, horarios")
      .order("fecha");

    if (data) setFechasConHorarios(data);
  }

  // CLICK en una fecha = traer horarios y preparar para editar
  async function editarFecha(id, fechaStr, listaHorarios) {
    setEditingId(id);
    setFecha(fechaStr);
    setHorarios(listaHorarios);
  }

  // Agregar horario al array
  function agregarHorario() {
    if (!hora) return alert("Ingresá un horario valido.");
    if (horarios.includes(hora)) return alert("Ese horario ya existe.");

    setHorarios([...horarios, hora]);
    setHora("");
  }

  // Quitar horario
  function eliminarHorario(h) {
    setHorarios(horarios.filter((x) => x !== h));
  }

  // GUARDAR: si editingId existe → UPDATE. Si no → INSERT.
  async function guardarDisponibilidad() {
    if (!fecha) return alert("Seleccioná una fecha.");

    setLoading(true);

    let result;

    if (editingId) {
      // 👉 UPDATE existente
      result = await supabase
        .from("availability")
        .update({ fecha, horarios })
        .eq("id", editingId);
    } else {
      // 👉 INSERT nueva
      result = await supabase
        .from("availability")
        .insert([{ fecha, horarios }]);
    }

    if (result.error) {
      console.error(result.error);
      alert("Error al guardar en Supabase");
    } else {
      alert("Disponibilidad guardada correctamente!");
      resetForm();
      cargarFechas();
    }

    setLoading(false);
  }

  // Resetear formulario
  function resetForm() {
    setFecha("");
    setHora("");
    setHorarios([]);
    setEditingId(null);
  }

  return (
    <div className="p-4 max-w-md mx-auto text-white bg-[#1a1d23] rounded-lg shadow-lg">
      <h2 className="text-xl font-bold">Panel de Administración</h2>
      <p className="text-sm mb-4">Gestioná los días y horarios disponibles.</p>

      {/* Selección de fecha */}
      <label className="block mt-2">Elegir fecha</label>
      <input
        type="date"
        className="w-full p-2 rounded bg-[#30343a]"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />

      {/* Agregar horario */}
      <label className="block mt-4">Agregar horario (HH:MM)</label>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="10:30"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="flex-1 p-2 rounded bg-[#30343a]"
        />
        <button onClick={agregarHorario} className="bg-blue-500 px-4 rounded">
          Agregar
        </button>
      </div>

      {/* Horarios agregados */}
      {horarios.length > 0 && (
        <div className="mt-3">
          <p className="font-semibold">Horarios para el día:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {horarios.map((h) => (
              <div
                key={h}
                className="px-3 py-1 bg-gray-700 rounded flex items-center"
              >
                {h}
                <button
                  className="ml-2 text-red-400"
                  onClick={() => eliminarHorario(h)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones */}
      <button
        onClick={guardarDisponibilidad}
        disabled={loading}
        className="mt-4 bg-green-600 w-full py-2 rounded font-bold"
      >
        {editingId ? "Guardar cambios" : "Guardar disponibilidad"}
      </button>

      {editingId && (
        <button onClick={resetForm} className="mt-2 w-full py-2 rounded bg-gray-600">
          Cancelar edición
        </button>
      )}

      <hr className="my-4 border-gray-600" />

      {/* Fechas existentes */}
      <h3 className="text-lg font-bold">Fechas con horarios:</h3>

      {fechasConHorarios.length === 0 ? (
        <p>No hay fechas cargadas.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {fechasConHorarios.map((item) => (
            <li
              key={item.id}
              className="bg-[#30343a] p-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => editarFecha(item.id, item.fecha, item.horarios)}
            >
              <strong>{item.fecha}</strong> — {item.horarios.length} horarios
            </li>
          ))}
        </ul>

      )}
      <button
        onClick={() => {
          localStorage.removeItem("isAdmin");
          window.location.href = "/";
        }}
        className="bg-red-500 items-center text-white px-4 py-2 rounded mt-4"
      >
        Salir del modo Admin
      </button>

    </div>
  );
}
