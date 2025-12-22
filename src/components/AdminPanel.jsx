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
    // 1) Traer SOLO disponibilidades
    const { data: disponibles, error: err1 } = await supabase
      .from("reservas")
      .select("id, fecha, hora, habilitado, nombre, user_key")
      .eq("habilitado", true)
      .order("fecha", { ascending: true });

    if (err1) {
      console.error(err1);
      setFechasConHorarios([]);
      return;
    }

    // 2) Traer reservas reales (nombre != 'DISPONIBLE')
    const { data: reservas, error: err2 } = await supabase
      .from("reservas")
      .select("fecha, hora, nombre")
      .neq("nombre", "DISPONIBLE");

    const mapa = {};

    disponibles.forEach(d => {
      if (!mapa[d.fecha]) mapa[d.fecha] = { fecha: d.fecha, horarios: [] };

      // por defecto un horario habilitado es DISPONIBLE
      let estado = "DISPONIBLE";

      // si existe una reserva real → ocupado
      if (reservas.some(r => r.fecha === d.fecha && r.hora === d.hora)) {
        estado = "OCUPADO";
      }

      mapa[d.fecha].horarios.push({
        hora: d.hora,
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
  async function ocuparHorarioManual(fecha, horaOrHorario) {
    // horaOrHorario puede ser '10:30' o un objeto {id, hora}
    let hora = null;
    let horaTexto = horaOrHorario;

    if (typeof horaOrHorario === "object" && horaOrHorario?.id) {
      hora = horaOrHorario.hora;
      horaTexto = horaOrHorario.hora;
    } else {
      // intentar mapear por hora en predefinidos
      const found = HORARIOS.find((h) => h.hora === horaOrHorario);
      if (found) hora = found.id;
    }

    const fechaISO = fecha;

    // Validar no duplicado (por fecha + hora si existe, si no por hora string)
    let query = supabase.from("reservas").select("id").eq("fecha", fechaISO);
    if (hora) query = query.eq("hora", hora).limit(1).maybeSingle();
    else query = query.eq("hora", horaTexto).limit(1).maybeSingle();

    const { data: existe } = await query;

    if (existe) return alert("Ese horario ya está ocupado.");

    const { error } = await supabase.from("reservas").insert([
      {
        fecha: fechaISO,
        hora: horaTexto,
        nombre: "OCUPADO MANUAL",
        user_key: "manual"
      },
    ]);


    if (error) return alert("Error al ocupar turno.");

    setRefresh((n) => n + 1);
    await cargarFechas();
    alert("Horario marcado como ocupado.");
  }

  async function liberarHorarioManual(fecha, horaOrHorario) {
    let hora = null;
    let horaTexto = horaOrHorario;

    if (typeof horaOrHorario === "object" && horaOrHorario?.id) {
      hora = horaOrHorario.hora;
      horaTexto = horaOrHorario.hora;
    } else {
      const found = HORARIOS.find((h) => h.hora === horaOrHorario);
      if (found) hora = found.id;
    }

    // Buscar reserva por fecha+hora o fecha+hora
    let q = supabase.from("reservas").select("id");
    if (hora) q = q.eq("fecha", fecha).eq("hora", hora).limit(1).maybeSingle();
    else q = q.eq("fecha", fecha).eq("hora", horaTexto).limit(1).maybeSingle();

    const { data: reserva } = await q;

    if (!reserva) return alert("No existe turno para liberar.");

    const { error } = await supabase.from("reservas").delete().eq("id", reserva.id);

    if (error) return alert("No se pudo liberar.");

    setRefresh((n) => n + 1);
    await cargarFechas();
    if (editingId) {
      const fila = fechasConHorarios.find((f) => f.id === editingId);
      if (fila) setHorarios(fila.horarios);
    }
    alert("Turno liberado.");
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

      {/* Botón para deshabilitar (borrado) */}
      <div className="mt-2">
        <button
          onClick={async () => {
            if (!fecha) return alert("Seleccioná una fecha.");
            // elimina todos los horarios habilitados para esa fecha (o podés hacer por id)
            if (!confirm(`¿Querés deshabilitar todos los horarios para ${fecha}?`)) return;
            await deshabilitarTodosHorariosFecha(fecha);
          }}
          className="bg-red-600 px-4 py-2 rounded mt-2"
        >
          Deshabilitar todos los horarios del día
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
              key={item.fecha || item.id}
              className="bg-[#30343a] p-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => editarFecha(item.fecha, item.fecha, item.horarios)}
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
