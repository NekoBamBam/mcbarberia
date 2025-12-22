// Turnos.jsx
import { useEffect, useRef, useState } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "../lib/supabaseClient";

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
  const [selectedHorario, setSelectedHorario] = useState(null);
  const horariosRef = useRef(null);
  const whatsappNumber = "2215691249";
  const [miTurno, setMiTurno] = useState(null);
  const [diasDisponibles, setDiasDisponibles] = useState([]);     // lista de Date()
  const [horarios, setHorarios] = useState([]);
  const [ocupados, setOcupados] = useState([]);

  useEffect(() => {
    async function cargarDiasDisponibles() {
      const { data, error } = await supabase
        .from("horarios")
        .select("fecha")
        .eq("habilitado", true);

      if (error) {
        console.error(error);
        return;
      }

      const fechas = [...new Set(data.map(d => d.fecha))]
        .map(f => new Date(f));

      setDiasDisponibles(fechas);
    }

    cargarDiasDisponibles();
  }, []);

  useEffect(() => {
    async function checkTurnoUsuario() {
      const userKey = getOrCreateUserKey();

      const { data } = await supabase
        .from("reservas")
        .select("id, fecha, hora")
        .eq("user_key", userKey)
        .gte("fecha", new Date().toISOString().split("T")[0])
        .order("fecha", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) setMiTurno(data);
    }

    checkTurnoUsuario();
  }, []);



  useEffect(() => {
    if (!selectedDay || !horariosRef.current) return;
    setSelectedHorario(null);
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        horariosRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });
  }, [selectedDay]);

  const handleSelect = (day) => {
    if (!day) return;

    const fechaStr = day.toISOString().split("T")[0];

    // Si el día NO está habilitado → NO HACER NADA
    const diaHabilitado = diasDisponibles.some(
      d => d.toISOString().split("T")[0] === fechaStr
    );

    if (!diaHabilitado) {
      return; // No permite seleccionar días no habilitados
    }

    setSelectedDay(day);
  };

  useEffect(() => {
    if (!selectedDay) return;

    async function cargarDia() {
      const fechaISO = selectedDay.toISOString().split("T")[0];

      const { data: horariosDB } = await supabase
        .from("horarios")
        .select("hora")
        .eq("fecha", fechaISO)
        .eq("habilitado", true);

      const { data: reservasDB } = await supabase
        .from("reservas")
        .select("hora")
        .eq("fecha", fechaISO);

      setHorarios(horariosDB.map(h => h.hora));
      setOcupados(reservasDB.map(r => r.hora));
    }

    cargarDia();
  }, [selectedDay]);


  async function reservarTurno(fecha, hora) {
    const userKey = getOrCreateUserKey();

    const { data: existente } = await supabase
      .from("reservas")
      .select("id")
      .eq("fecha", fecha)
      .eq("hora", hora)
      .maybeSingle();

    if (existente) {
      alert("Ese turno ya fue tomado");
      return false;
    }

    const { error } = await supabase
      .from("reservas")
      .insert({ fecha, hora, user_key: userKey });

    if (error) {
      alert("Error al reservar");
      return false;
    }

    return true;
  }


  return (
    <div id="turnos" className="flex flex-col items-center bg-black gap-6 p-6 text-white">
      <h2 className="text-2xl font-bold">Turnos</h2>

      {miTurno && (
        <div className="bg-yellow-200 text-black p-4 rounded-xl mb-4 shadow-md">
          <p className="font-semibold">Ya tenés un turno pendiente</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-10 w-full max-w-5xl justify-center">
        <div className="flex justify-center w-full md:w-auto">
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={handleSelect}
            disabled={{ before: new Date() }}

            modifiers={{
              habilitado: diasDisponibles,
            }}

            modifiersStyles={{
              habilitado: {
                backgroundColor: "#16a34a",
                color: "white",
                fontWeight: "bold",
              }
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
                {horarios.map(hora => {
                  const estaOcupado = ocupados.includes(hora);

                  return (
                    <button
                      key={hora}
                      disabled={estaOcupado}
                      className={`px-3 py-2 rounded-lg text-sm
    ${estaOcupado
                          ? "bg-gray-400 cursor-not-allowed"
                          : selectedHorario === hora
                            ? "bg-green-700"
                            : "bg-green-500 hover:bg-green-600"}
  `}
                      onClick={() => setSelectedHorario(hora)}
                    >

                    </button>
                  );
                })}

              </div>

              {selectedHorario && (
                <button
                  onClick={async () => {
                    const fechaISO = selectedDay.toISOString().split("T")[0];

                    const userKey = getOrCreateUserKey();

                    // 1) Ver si ya tiene un turno reservado EN ESE DIA por este user_key
                    const { data: turnoExistente } = await supabase.from("reservas").select("id, fecha, hora, hora").eq("user_key", userKey).eq("fecha", fechaISO).maybeSingle();

                    if (turnoExistente) {
                      alert("⚠ Ya tenés un turno pendiente ese día.");
                      setMiTurno(turnoExistente);
                      return;
                    }

                    // 2) Reservar y luego abrir WhatsApp solo si se reservó bien
                    const ok = await reservarTurno(fechaISO, selectedHorario);
                    if (!ok) return;

                    const userKeyShort = userKey.slice(-4);
                    const diaSemana = format(selectedDay, "EEEE", { locale: es });
                    const fecha = format(selectedDay, "dd/MM", { locale: es });
                    const horaTexto = selectedHorario;

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

    </div>
  );
}
