// Turnos.jsx
import { useEffect, useRef, useState } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "../lib/supabaseClient";
import { HORARIOS } from "./Horarios";

// Genera y guarda clave única por usuario
function getOrCreateUserKey() {
  let key = localStorage.getItem("user_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("user_key", key);
  }
  return key;
}

export default function Turnos() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHorarioId, setSelectedHorarioId] = useState(null);
  const [ocupadosIds, setOcupadosIds] = useState([]);
  const [precioConfirmado, setPrecioConfirmado] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pendingDay, setPendingDay] = useState(null);
  const horariosRef = useRef(null);
  const whatsappNumber = "2215691249";
  const [miTurno, setMiTurno] = useState(null);
  const [diasDisponibles, setDiasDisponibles] = useState([]);     // lista de Date()
  const [availableHorarioIds, setAvailableHorarioIds] = useState([]); // ids habilitados para selectedDay


  // Cargar ocupados cuando cambie la fecha
  useEffect(() => {
    fetchOcupados();
    checkTurnoUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);
  // Cargar días disponibles (habilitados) una sola vez
  useEffect(() => {
    async function fetchDiasDisponibles() {
      const { data, error } = await supabase
        .from("reservations")
        .select("fecha")
        .eq("habilitado", true);

      if (!error && data) {
        const unique = [...new Set(data.map(d => d.fecha))];
        setDiasDisponibles(unique.map(f => new Date(f)));
      } else {
        setDiasDisponibles([]);
      }
    }
    fetchDiasDisponibles();
  }, []);

  // Cargar HORARIOS disponibles solo cuando cambie el día
  useEffect(() => {
    async function fetchAvailableHorarios() {
      if (!selectedDay) {
        setAvailableHorarioIds([]);
        return;
      }
      const fechaISO = selectedDay.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("reservations")
        .select("hora_id")
        .eq("fecha", fechaISO)
        .eq("habilitado", true);

      if (!error && data) {
        setAvailableHorarioIds(data.map(d => d.hora_id).filter(Boolean));
      } else {
        setAvailableHorarioIds([]);
      }
    }

    fetchAvailableHorarios();
  }, [selectedDay]);

  async function checkTurnoUsuario() {
    const userKey = getOrCreateUserKey();
    if (!userKey || !selectedDay) return;

    const fechaISO = selectedDay.toISOString().split("T")[0];


    const { data, error } = await supabase
      .from("reservations")
      .select("id, fecha, hora, hora_id")
      .eq("user_key", userKey)
      .eq("fecha", fechaISO)
      .maybeSingle();

    if (data) setMiTurno(data);
    else setMiTurno(null);
  }

  async function fetchOcupados() {
    if (!selectedDay) return setOcupadosIds([]);

    const fechaISO = selectedDay.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("reservations")
      .select("hora_id")
      .eq("fecha", fechaISO)
      .eq("habilitado", false);

    if (!error && data) {
      setOcupadosIds(data.map(d => d.hora_id).filter(Boolean));
    } else {
      setOcupadosIds([]);
    }
  }


  useEffect(() => {
    if (!selectedDay || !horariosRef.current) return;
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        horariosRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });
  }, [selectedDay]);

  const handleSelect = (day) => {
    if (!day) return setSelectedDay(null);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fecha = new Date(day);
    fecha.setHours(0, 0, 0, 0);

    if (fecha < hoy) return;

    setSelectedHorarioId(null);

    // Si YA confirmó el precio → NO mostrar modal
    if (precioConfirmado) {
      setSelectedDay(day);
      return;
    }

    setPendingDay(day);
    setShowPriceModal(true);
  };

  const confirmarPrecio = () => {
    setSelectedDay(pendingDay);
    setPendingDay(null);
    setShowPriceModal(false);
    setPrecioConfirmado(true);
  };

  const cancelarPrecio = () => {
    setPendingDay(null);
    setShowPriceModal(false);
  };

  const horarios = HORARIOS.filter(h => availableHorarioIds.includes(h.id));


  async function reservarTurno(fechaISO, horarioId) {
    const userKey = getOrCreateUserKey();

    const fechaDB = fechaISO; // ← USAR SIEMPRE LA FECHA QUE YA VIENE VALIDADA

    // 1) Validar si ese horario YA está ocupado
    const { data: ocupado } = await supabase
      .from("reservations")
      .select("id")
      .eq("fecha", fechaDB)
      .eq("hora_id", horarioId)
      .maybeSingle();

    if (ocupado) {
      alert("⛔ Ese horario ya fue reservado.");
      await fetchOcupados();
      return false;
    }

    // 2) Validar límite: 1 turno por día por usuario
    const { data: tieneTurnoEseDia } = await supabase
      .from("reservations")
      .select("id")
      .eq("fecha", fechaDB)
      .eq("user_key", userKey)
      .maybeSingle();

    if (tieneTurnoEseDia) {
      alert("⛔ Ya reservaste un turno ese día.");
      return false;
    }

    const horarioObj = HORARIOS.find((h) => h.id === horarioId);

    // 3) Insertar la reserva REAL
    const { error: insertError } = await supabase.from("reservations").insert([
      {
        fecha: fechaDB,
        hora: horarioObj.hora,
        nombre: "Cliente",
        user_key: userKey,
        hora_id: horarioId,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      await fetchOcupados();
      alert("⛔ No se pudo reservar. Intenta otra vez.");
      return false;
    }

    await fetchOcupados();
    return true;
  }


  return (
    <div id="turnos" className="flex flex-col items-center bg-black gap-6 p-6 text-white">
      <h2 className="text-2xl font-bold">Turnos</h2>

      {miTurno && (
        <div className="bg-yellow-200 text-black p-4 rounded-xl mb-4 shadow-md">
          <p className="font-semibold">Ya tenés un turno pendiente</p>

          <button onClick={() => setMiTurno(miTurno)} className="mt-2 bg-black text-white px-4 py-2 rounded-lg">
            Ver mi turno
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-10 w-full max-w-5xl justify-center">
        <div className="flex justify-center w-full md:w-auto">
          <DayPicker
  mode="single"
  selected={selectedDay}
  onSelect={setSelectedDay}
  locale={es}
  fromDate={new Date()}
  disabled={[
    { before: new Date() },
    (date) =>
      !diasDisponibles.some(
        (d) => d.toDateString() === date.toDateString()
      )
  ]}

  // NUEVO: estilos según disponibilidad
  modifiers={{
    disponible: (date) =>
      diasDisponibles.some(
        (d) => d.toDateString() === date.toDateString()
      ),
    nodisponible: (date) =>
      !diasDisponibles.some(
        (d) => d.toDateString() === date.toDateString()
      ),
  }}

  modifiersClassNames={{
    disponible: "dia-disponible",
    nodisponible: "dia-nodisponible",
  }}
/>



        </div>

        <div
          ref={horariosRef}
          className={`w-full md:w-1/2 max-w-md transition-all duration-450 ease-out ${selectedDay ? "opacity-100 translate-y-0 max-h-[2000px] mt-6" : "opacity-0 translate-y-6 max-h-0 mt-0 pointer-events-none"} overflow-hidden md:opacity-100 md:translate-y-0 md:max-h-[2000px] md:mt-0`}
        >
          {selectedDay ? (
            <>
              <h3 className="text-xl font-bold mb-4 text-center md:text-left">Horarios para {format(selectedDay, "dd/MM/yyyy")}</h3>

              <div className="grid grid-cols-3 gap-3">
                {horarios.map((h) => {
                  const estaOcupado = ocupadosIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => !estaOcupado && setSelectedHorarioId(h.id)}
                      disabled={estaOcupado}
                      className={`p-3 cursor-pointer rounded-xl border transition ${estaOcupado ? "bg-red-500 text-white opacity-70 cursor-not-allowed" : selectedHorarioId === h.id ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
                    >
                      {h.hora} {estaOcupado && "OCUPADO"}
                    </button>
                  );
                })}
              </div>

              {selectedHorarioId && (
                <button
                  onClick={async () => {
                    const fechaISO = selectedDay.toISOString().split("T")[0];

                    const userKey = getOrCreateUserKey();

                    // 1) Ver si ya tiene un turno reservado EN ESE DIA por este user_key
                    const { data: turnoExistente } = await supabase.from("reservations").select("id, fecha, hora, hora_id").eq("user_key", userKey).eq("fecha", fechaISO).maybeSingle();

                    if (turnoExistente) {
                      alert("⚠ Ya tenés un turno pendiente ese día.");
                      setMiTurno(turnoExistente);
                      return;
                    }

                    // 2) Reservar y luego abrir WhatsApp solo si se reservó bien
                    const ok = await reservarTurno(fechaISO, selectedHorarioId);
                    if (!ok) return;

                    const userKeyShort = userKey.slice(-4);
                    const diaSemana = format(selectedDay, "EEEE", { locale: es });
                    const fecha = format(selectedDay, "dd/MM", { locale: es });
                    const horaTexto = HORARIOS.find((x) => x.id === selectedHorarioId)?.hora || "";

                    const mensaje = `Hola Martin! Te confirmo turno para el ${diaSemana} ${fecha} a las ${horaTexto}. Mi codigo de cliente es ${userKeyShort}`;

                    const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
                    window.open(link, "_blank");
                  }}
                  className="mt-6 w-full cursor-pointer text-center px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Reservar turno
                </button>
              )}
            </>
          ) : (
            <div className="p-4 bg-white text-black rounded-xl">
              <p className="font-medium mb-2">Seleccioná una fecha para ver horarios</p>
              <p className="text-sm">Tocá un día en el calendario y los horarios disponibles aparecerán aquí.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de turno */}
      {miTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm text-center shadow-lg">
            <h2 className="font-bold text-xl mb-2 text-black">Tu turno reservado</h2>

            <p className="text-black">
              <b>Fecha:</b> {miTurno.fecha}
            </p>
            <p className="text-black">
              <b>Hora:</b> {miTurno.hora}
            </p>

            <button className="mt-4 bg-black text-white px-4 py-2 rounded-lg" onClick={() => setMiTurno(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PRECIO */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-xl w-80 shadow-lg text-center">
            <h3 className="text-xl font-bold mb-3">Politica de cancelación</h3>
            <p className="mb-5 text-lg font-semibold">
              Para respetar el tiempo de cada cliente, las cancelaciones deben realizarse con un mínimo de 2 horas de
              anticipación. De no ser así, <a className="text-red-500"> se aplicará el cargo correspondiente al valor completo del servicio reservado.</a>
            </p>

            <div className="flex gap-4 justify-center">
              <button className="px-4 py-2 bg-gray-300 rounded-xl" onClick={cancelarPrecio}>
                Cancelar
              </button>

              <button className="px-4 py-2 bg-green-600 text-white rounded-xl" onClick={confirmarPrecio}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
