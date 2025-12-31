// AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import HorarioItem from "./HorarioItem";
import { HORARIOS } from "./Horarios";


export default function AdminPanel() {
  const [selectedHorarioIdForEnable, setSelectedHorarioIdForEnable] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horarios, setHorarios] = useState([]); // array de strings (HH:MM) - para compatibilidad visual
  const [fechasConHorarios, setFechasConHorarios] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  // lista local de horarios seleccionados para guardar en batch
  const [batchHorarios, setBatchHorarios] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horariosDelDia, setHorariosDelDia] = useState([]);

  async function cargarHorariosPorFecha(fechaISO) {
    const { data, error } = await supabase
      .from("reservas")
      .select("id, hora, nombre, habilitado")
      .eq("fecha", fechaISO);

    if (error) {
      console.error(error);
      return;
    }

    const resultado = data.map(r => ({
      id: r.id,
      hora: r.hora,
      estado:
        r.habilitado && r.nombre === "DISPONIBLE"
          ? "LIBRE"
          : "OCUPADO",
      raw: r
    }));

    setHorariosDelDia(resultado);
  }

  useEffect(() => {
    (async () => {
      // check rápido: intentar seleccionar 1 fila de availability
      /* try {
        const { error } = await supabase.from("availability").select("fecha").limit(1);
        if (error) {
          setHasAvailabilityTable(false);
        } else {
          setHasAvailabilityTable(true);
        }
      } catch (e) {
        setHasAvailabilityTable(false);
      } */
      cargarFechas();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    if (editingId && fechasConHorarios.length > 0) {
      const fila = fechasConHorarios.find((f) => f.id === editingId);
      if (fila) setHorarios(fila.horarios || []);
    }
  }, [fechasConHorarios, editingId]);

  async function cargarFechas() {
    const { data, error } = await supabase
      .from("reservas")
      .select("fecha, hora, habilitado, nombre")
      .order("fecha", { ascending: true });

    if (error) {
      console.error(error);
      setFechasConHorarios([]);
      return;
    }

    const mapa = {};

    data.forEach(r => {
      if (!mapa[r.fecha]) {
        mapa[r.fecha] = {
          fecha: r.fecha,
          horarios: []
        };
      }

      const estado =
        r.habilitado && r.nombre === "DISPONIBLE"
          ? "LIBRE"
          : "OCUPADO";

      mapa[r.fecha].horarios.push({
        hora: r.hora,
        estado
      });
    });

    setFechasConHorarios(Object.values(mapa));
  }



  async function editarFecha(id, f, hs) {
    setEditingId(id);
    setFecha(f);
    setHorarios(hs);
  }

  // --- Turnos manuales (ocupar / liberar) ---
  // Ahora usamos hora si el horario viene con id, o buscamos id por hora en lista predef.
  async function ocuparHorarioManual(id) {
    const { error } = await supabase
      .from("reservas")
      .update({
        habilitado: false,
        nombre: "OCUPADO MANUAL",
        user_key: "manual",
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error al ocupar turno.");
      return;
    }

    setRefresh((n) => n + 1);
    await cargarFechas();
    alert("Horario marcado como ocupado ✅");
  }

  async function liberarHorarioManual(id) {
    const { error } = await supabase
      .from("reservas")
      .update({
        habilitado: true,
        nombre: "DISPONIBLE",
        user_key: "admin",
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("No se pudo liberar el turno.");
      return;
    }

    setRefresh((n) => n + 1);
    await cargarFechas();

    alert("Horario liberado ✅");
  }

  // Habilita un horario (inserta fila que marca disponibilidad)
  async function habilitarHorario(fechaISO, horarioId) {
    // obtener la hora REAL desde horarios.js
    const horarioObj = HORARIOS.find(h => h.id === horarioId);
    const horaTexto = horarioObj?.hora || "";

    // si ya existe esa disponibilidad, no duplicar
    const { data: existe } = await supabase
      .from("reservas")
      .select("id")
      .eq("fecha", fechaISO)
      .eq("hora", horaTexto) // ← ahora sí, porque ya está declarado arriba
      .eq("habilitado", true)
      .limit(1)
      .maybeSingle();

    if (existe) return alert("Ese horario ya está habilitado en esa fecha.");

    // insertar el horario habilitado
    const { error } = await supabase.from("reservas").insert([
      {
        fecha: fechaISO,
        hora: horaTexto,
        nombre: "DISPONIBLE",
        user_key: "admin",
        habilitado: true
      }
    ]);

    if (error) {
      console.error(error);
      return alert("No se pudo habilitar el horario.");
    }

    setRefresh((n) => n + 1);
    await cargarFechas();
    alert("Horario habilitado correctamente.");
  }

  async function guardarBatchHorarios(fechaISO) {
    if (!fechaISO) return alert("Seleccioná una fecha.");
    if (batchHorarios.length === 0) return alert("No seleccionaste horarios.");

    // Armar objetos para insertar
    const filas = batchHorarios.map((id) => {
      const h = HORARIOS.find((x) => x.id === id);
      return {
        fecha: fechaISO,
        hora: h.hora,
        nombre: "DISPONIBLE",
        user_key: "admin",
        habilitado: true
      };
    });

    // Evitar duplicados → eliminar primero lo que ya exista
    await supabase
      .from("reservas")
      .delete()
      .eq("fecha", fechaISO)
      .eq("habilitado", true);

    // Insertar todo junto
    const { error } = await supabase.from("reservas").insert(filas);

    if (error) {
      console.error(error);
      return alert("Error al guardar los horarios.");
    }

    setBatchHorarios([]);
    setRefresh(n => n + 1);
    alert("Horarios guardados correctamente.");
  }

  // Deshabilita (borra) todas las disponibilidades de una fecha
  async function deshabilitarTodosHorariosFecha(fechaISO) {
    // Eliminamos SOLO las filas que son disponibilidades (habilitado = true)
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("fecha", fechaISO)
      .eq("habilitado", true);

    if (error) {
      console.error(error);
      return alert("No se pudo deshabilitar los horarios del día.");
    }

    setRefresh(n => n + 1);
    await cargarFechas();
    alert("Horarios del día deshabilitados.");
  }

  // --- Agregar / eliminar horarios del día (solo UI local) ---
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
      {/* Agregar / Habilitar horario predefinido */}
      <label className="block mt-4">Habilitar horario predefinido</label>
      {/* NUEVO: selección múltiple */}
      <div className="mt-4 p-2 bg-[#23272f] rounded">
        <p className="mb-2 font-semibold text-sm">Seleccionar varios horarios:</p>
        <div className="grid grid-cols-2 gap-2">
          {HORARIOS.map((h) => (
            <label key={h.id} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                className="accent-blue-500"
                checked={batchHorarios.includes(h.id)}
                onChange={() => {
                  if (batchHorarios.includes(h.id)) {
                    setBatchHorarios(batchHorarios.filter((x) => x !== h.id));
                  } else {
                    setBatchHorarios([...batchHorarios, h.id]);
                  }
                }}
              />
              <span>{h.hora}</span>
            </label>
          ))}
        </div>
      </div>
      <hr className="my-4 border-gray-600" />

      <label className="block mt-2 font-semibold">
        Agregar horario manual
      </label>

      <div className="flex gap-2 mt-2">
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="flex-1 p-2 rounded bg-[#30343a]"
        />

        <button
          onClick={async () => {
            if (!fecha) return alert("Seleccioná una fecha");
            if (!hora) return alert("Seleccioná una hora");

            // evitar duplicados
            const { data: existe } = await supabase
              .from("reservas")
              .select("id")
              .eq("fecha", fecha)
              .eq("hora", hora)
              .maybeSingle();

            if (existe) {
              return alert("Ese horario ya existe para ese día");
            }

            const { error } = await supabase.from("reservas").insert([
              {
                fecha,
                hora,
                nombre: "DISPONIBLE",
                user_key: "admin",
                habilitado: true
              }
            ]);

            if (error) {
              console.error(error);
              return alert("No se pudo agregar el horario");
            }

            setHora("");
            setRefresh(n => n + 1);
            alert("Horario manual agregado ✅");
          }}
          className="bg-blue-600 px-4 py-2 rounded font-semibold"
        >
          Agregar
        </button>
      </div>
      
      {editingId && (
        <button onClick={resetForm} className="mt-2 w-full py-2 rounded bg-gray-600">
          Cancelar edición
        </button>
      )}

      <hr className="my-4 border-gray-600" />
      <button
        onClick={() => guardarBatchHorarios(fecha)}
        className="mt-3 w-full bg-green-600 py-2 rounded font-bold"
      >
        Guardar turnos del día
      </button>

      {/* Fechas existentes */}
      <h3 className="text-lg font-bold">Fechas con horarios:</h3>

      {fechasConHorarios.length === 0 ? (
        <p>No hay fechas cargadas.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {fechasConHorarios.map((item) => (
            <li
              key={item.fecha}
              onClick={() => {
                setFechaSeleccionada(item.fecha);
                cargarHorariosPorFecha(item.fecha);
              }}
              className="bg-[#30343a] p-3 rounded cursor-pointer hover:bg-gray-700"
            >
              <strong>{item.fecha}</strong> — {item.horarios.length} horarios
            </li>

          ))}
        </ul>
      )}
      {/* DETALLE DE HORARIOS DEL DÍA */}
      {fechaSeleccionada && (
        <div className="mt-4 bg-[#23272f] p-4 rounded">
          <h3 className="font-bold mb-3">
            Horarios del {fechaSeleccionada}
          </h3>

          {horariosDelDia.length === 0 ? (
            <p className="text-sm text-gray-300">No hay horarios cargados.</p>
          ) : (
            horariosDelDia.map(h => (
              <div
                key={h.id}
                className="flex justify-between items-center mb-2 bg-[#30343a] p-2 rounded"
              >
                <span>
                  {h.hora} —{" "}
                  <b className={h.estado === "LIBRE" ? "text-green-400" : "text-red-400"}>
                    {h.estado}
                  </b>
                </span>

                <div className="flex gap-2">
                  {h.estado === "LIBRE" ? (
                    <button
                      onClick={() => ocuparHorarioManual(h.id)}
                      className="bg-red-600 px-2 py-1 rounded text-sm"
                    >
                      Ocupar
                    </button>
                  ) : (
                    <button
                      onClick={() => liberarHorarioManual(h.id)}
                      className="bg-green-600 px-2 py-1 rounded text-sm"
                    >
                      Liberar
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar este horario?")) return;
                      await supabase.from("reservas").delete().eq("id", h.id);
                      cargarHorariosPorFecha(fechaSeleccionada);
                    }}
                    className="bg-gray-600 px-2 py-1 rounded text-sm"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
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
