import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import HorarioItem from "./HorarioItem";

export default function AdminPanel() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [fechasConHorarios, setFechasConHorarios] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Cargar fechas del calendario
  useEffect(() => {
    cargarFechas();
  }, []);
  useEffect(() => {
    if (editingId && fechasConHorarios.length > 0) {
      const fila = fechasConHorarios.find(f => f.id === editingId);
      if (fila) setHorarios(fila.horarios);
    }
  }, [fechasConHorarios, editingId]);

  async function cargarFechas() {
    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .order("fecha", { ascending: true });

    if (!error) setFechasConHorarios(data);

  }

  async function editarFecha(id, f, hs) {
    setEditingId(id);
    setFecha(f);
    setHorarios(hs);
  }

  // --- Turnos manuales (ocupar / liberar) ---

  async function ocuparHorarioManual(fecha, hora) {
    const { data: existe } = await supabase
      .from("reservations")
      .select("id")
      .eq("fecha", fecha)
      .eq("hora", hora)
      .limit(1)
      .maybeSingle();

    if (existe) return alert("Ese horario ya está ocupado.");

    const { error } = await supabase
      .from("reservations")
      .insert([{ fecha, hora, nombre: "OCUPADO MANUAL" }]);

    if (error) return alert("Error al ocupar turno.");

    setRefresh(n => n + 1);
    await cargarFechas();
    alert("Horario marcado como ocupado.");

  }

  async function liberarHorarioManual(fecha, hora) {


    const { data: reserva } = await supabase
      .from("reservations")
      .select("id")
      .eq("fecha", fecha)
      .eq("hora", hora)
      .limit(1)
      .maybeSingle();

    if (!reserva) return console.log("No existe turno para liberar.");

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reserva.id);

    if (error) return alert("No se pudo liberar.");

    setRefresh(n => n + 1);
    await cargarFechas();
    if (editingId) {
      const fila = fechasConHorarios.find(f => f.id === editingId);
      if (fila) setHorarios(fila.horarios);
    }
    alert("Turno liberado.");

  }

  // --- Agregar / eliminar horarios del día ---

  function agregarHorario() {
    if (!hora) return alert("Ingresá una hora.");
    if (!horarios.includes(hora)) {
      setHorarios([...horarios, hora]);
    }
    setHora("");
  }

  function eliminarHorario(h) {
    setHorarios(horarios.filter((x) => x !== h));
  }

  // --- Guardar disponibilidad ---

  async function guardarDisponibilidad() {
    if (!fecha) return alert("Seleccioná una fecha.");

    setLoading(true);

    const { data: existe } = await supabase
      .from("availability")
      .select("id")
      .eq("fecha", fecha)
      .limit(1)
      .maybeSingle();

    let result;

    if (existe) {
      result = await supabase
        .from("availability")
        .update({ horarios })
        .eq("id", existe.id);
    } else {
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
              <HorarioItem
                key={h}
                fecha={fecha}
                hora={h}
                refresh={refresh}
                onEliminar={eliminarHorario}
                onOcupar={ocuparHorarioManual}
                onLiberar={liberarHorarioManual}
              />
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
        <button
          onClick={resetForm}
          className="mt-2 w-full py-2 rounded bg-gray-600"
        >
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

      <button
        onClick={() => {
          localStorage.removeItem("isAdmin");
          window.location.href = "/#/admin-login";
        }}
        className="bg-red-500 px-4 py-2 rounded mt-2"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
