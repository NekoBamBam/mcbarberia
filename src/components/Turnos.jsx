import { useEffect, useRef, useState } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase as supabaseClient } from "../lib/supabaseClient";

export default function Turnos() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [ocupados, setOcupados] = useState([]);

  const horariosRef = useRef(null); // <-- ref para scrollear
  const whatsappNumber = "2215691249";

  // 1) Cargar disponibilidad
  useEffect(() => {
    const fetchAvailability = async () => {
      const { data, error } = await supabaseClient.from("availability").select("*");
      if (!error) setAvailability(data);
    };
    fetchAvailability();
  }, []);

  // 2) Cargar horas ocupadas
  useEffect(() => {
    const cargarOcupados = async () => {
      if (!selectedDay) return;
      const fechaISO = format(selectedDay, "yyyy-MM-dd");

      const { data, error } = await supabaseClient
        .from("reservations")
        .select("hora")
        .eq("fecha", fechaISO);

      if (!error) {
        setOcupados(data.map((t) => t.hora));
      } else {
        setOcupados([]);
      }
    };

    cargarOcupados();
  }, [selectedDay]);

  // 3) Al cambiar selectedDay -> scrollear el panel de horarios en mobile
  useEffect(() => {
    if (!selectedDay || !horariosRef.current) return;

    // Solo en pantallas móviles (ajustá el ancho si querés)
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // Esperamos a que el panel pase a estar visible con la animación
    // requestAnimationFrame + timeout hace la aparición más suave y consistente
    requestAnimationFrame(() => {
      setTimeout(() => {
        horariosRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });
  }, [selectedDay]);

  // 4) Manejar selección de día
  const handleSelect = (day) => {
    if (!day) return setSelectedDay(null);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fecha = new Date(day);
    fecha.setHours(0, 0, 0, 0);

    if (fecha < hoy) return;

    const fechaISO = format(day, "yyyy-MM-dd");
    const disp = availability?.find((d) => d.fecha === fechaISO);

    // ❗ si NO tiene horarios -> no es clickeable
    if (!disp || !disp.horarios || disp.horarios.length === 0) return;

    setSelectedHour(null);
    setSelectedDay(day);
  };


  // 5) Horarios disponibles (idéntico)
  const horarios = (() => {
    if (!selectedDay) return [];
    const fechaISO = format(selectedDay, "yyyy-MM-dd");
    const disponibilidad = availability?.find((d) => d.fecha === fechaISO);
    return disponibilidad ? disponibilidad.horarios : [];
  })();

  const isDayAvailable = (day) => {
    const fechaISO = format(day, "yyyy-MM-dd");
    const d = availability?.find((x) => x.fecha === fechaISO);
    return d && d.horarios && d.horarios.length > 0;
  };


  return (
    <div id="turnos" className="flex flex-col items-center bg-black gap-6 p-6 text-white">
      <h2 className="text-2xl font-bold">Turnos</h2>

      {!availability && (
        <p className="text-white text-center mt-10">Cargando disponibilidad...</p>
      )}

      {availability && (
        <div className="flex flex-col md:flex-row md:gap-10 w-full max-w-5xl justify-center">
          {/* CALENDARIO */}
          <div className="flex justify-center w-full md:w-auto">
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={handleSelect}
              locale={es}
              className="p-4 border rounded-xl shadow-md bg-white text-black"

              disabled={(day) => !isDayAvailable(day)}

              modifiers={{
                noDisponible: (day) => !isDayAvailable(day),
              }}

              modifiersStyles={{
                noDisponible: {
                  color: "red",
                  textDecoration: "line-through",
                  opacity: 0.6,
                },
              }}
            />

          </div>

          {/* PANEL DE HORARIOS con animación y ref para scrollear */}
          <div
            ref={horariosRef}
            className={`
              w-full md:w-1/2 max-w-md
              transition-all duration-450 ease-out
              ${selectedDay ? "opacity-100 translate-y-0 max-h-[2000px] mt-6" : "opacity-0 translate-y-6 max-h-0 mt-0 pointer-events-none"}
              overflow-hidden
              md:opacity-100 md:translate-y-0 md:max-h-[2000px] md:mt-0
            `}
          >
            {/* Solo renderizamos el contenido si hay day seleccionado y horarios */}
            {selectedDay && horarios.length > 0 ? (
              <>
                <h3 className="text-xl font-bold mb-4 text-center md:text-left">
                  Horarios para {format(selectedDay, "dd/MM/yyyy")}
                </h3>

                <div className="grid  grid-cols-3 gap-3">
                  {horarios.map((hora) => {
                    const estaOcupado = ocupados.includes(hora);

                    return (
                      <button
                        key={hora}
                        onClick={() => !estaOcupado && setSelectedHour(hora)}
                        disabled={estaOcupado}
                        className={`p-3 cursor-pointer rounded-xl border transition 
                          ${estaOcupado
                            ? "bg-red-500 text-white opacity-70 cursor-not-allowed"
                            : selectedHour === hora
                              ? "bg-black text-white"
                              : "bg-white text-black hover:bg-gray-100"
                          }`}
                      >
                        {hora} {estaOcupado && "OCUPADO"}
                      </button>
                    );
                  })}
                </div>

                {selectedHour && (
                  <button
                    onClick={async () => {
                      const fechaISO = format(selectedDay, "yyyy-MM-dd");

                      const { data, error } = await supabaseClient.rpc("reservar_turno", {
                        p_fecha: fechaISO,
                        p_hora: selectedHour,
                        p_nombre: "Cliente",
                        p_telefono: "",
                      });

                      if (error || !data[0].success) {
                        alert("⛔ Ese turno ya fue tomado.");
                        return;
                      }

                      const diaSemana = format(selectedDay, "EEEE", { locale: es });
                      const fecha = format(selectedDay, "dd/MM", { locale: es });
                      const mensaje = `Hola Martin! Quiero un turno para el ${diaSemana} ${fecha} a las ${selectedHour}`;

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
              // Si no hay day seleccionado o no hay horarios, mostramos un pequeño instructivo (útil para quien no se da cuenta)
              <div className="p-4 bg-white text-black rounded-xl">
                <p className="font-medium mb-2">Seleccioná una fecha para ver horarios</p>
                <p className="text-sm">Tocá un día en el calendario y los horarios disponibles aparecerán aquí.</p>
                {/* <p className="text-sm"><a className="text-lg text-red-500"> ATENCION!</a> Pedimos compromiso con la puntualidad de los turnos, en caso de no avisar con tiempo
                  la ausencia, se cobrará la totalidad del corte.
                </p> */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
