import { useEffect, useState } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
// IMPORTACIÓN:
// Si en supabaseClient.js usaste 'export default', haz:
// import supabaseClient from "../lib/supabaseClient";
// Si en supabaseClient.js usaste 'export const supabaseClient', mantén:
import {supabase as supabaseClient } from "../lib/supabaseClient";

export default function Turnos() {
  // -----------------------
  // HOOKS – SIEMPRE ARRIBA
  // -----------------------
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  const [availability, setAvailability] = useState(null);
  const [ocupados, setOcupados] = useState([]);

  const whatsappNumber = "2215691249";

  // -----------------------
  // 1) Cargar disponibilidad
  // -----------------------
  useEffect(() => {
    const fetchAvailability = async () => {
      const { data, error } = await supabaseClient.from("availability").select("*"); // OK, usa supabaseClient

      if (!error) {
        setAvailability(data);
      }
    };

    fetchAvailability();
  }, []);

  // -----------------------
  // 2) Cargar horas ocupadas
  // -----------------------
  useEffect(() => {
    const cargarOcupados = async () => {
      if (!selectedDay) return;

      const fechaISO = format(selectedDay, "yyyy-MM-dd");

      // CORRECCIÓN: Usar supabaseClient en lugar de supabase
      const { data, error } = await supabaseClient 
        .from("reservations")
        .select("hora")
        .eq("fecha", fechaISO);

      if (!error) {
        setOcupados(data.map((t) => t.hora));
      }
    };

    cargarOcupados();
  }, [selectedDay]);

  // -----------------------
  // 3) Manejar selección de día
  // -----------------------
  const handleSelect = (day) => {
    if (!day) {
      setSelectedDay(null);
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fecha = new Date(day);
    fecha.setHours(0, 0, 0, 0);

    if (fecha < hoy) return;

    const fechaISO = format(day, "yyyy-MM-dd");
    const existe = availability?.find((d) => d.fecha === fechaISO);

    if (!existe) return;

    setSelectedDay(day);
  };

  // -----------------------
  // 4) Horarios disponibles
  // -----------------------
  const horarios = (() => {
    if (!selectedDay) return [];
    const fechaISO = format(selectedDay, "yyyy-MM-dd");
    const disponibilidad = availability?.find((d) => d.fecha === fechaISO);
    return disponibilidad ? disponibilidad.horarios : [];
  })();

  // -----------------------
  // 5) RENDER
  // -----------------------
  return (
    <div id="turnos" className="flex flex-col items-center bg-black gap-6 p-6 text-white">
      <h2 className="text-2xl font-bold">Turnos</h2>

      {/* Mostrar Loading dentro del render (NO antes de los hooks) */}
      {!availability && (
        <p className="text-white text-center mt-10">Cargando disponibilidad...</p>
      )}

      {availability && (
        <div className="flex flex-col md:flex-row md:gap-10 w-full max-w-5xl justify-center">
          {/* Calendario */}
          <div className="flex justify-center w-full md:w-auto">
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={handleSelect}
              locale={es}
              className="p-4 border rounded-xl shadow-md bg-white text-black"
              modifiers={{
                noDisponible: (day) => {
                  const fechaISO = format(day, "yyyy-MM-dd");
                  const existe = availability?.some((d) => d.fecha === fechaISO);
                  return !existe;
                },
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

          {selectedDay && horarios.length > 0 && (
            <div className="mt-6 md:mt-0 w-full md:w-1/2 max-w-md">
              <h3 className="text-xl font-bold mb-4 text-center md:text-left">
                Horarios disponibles para {format(selectedDay, "dd/MM/yyyy")}
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {horarios.map((hora) => {
                  const estaOcupado = ocupados.includes(hora);

                  return (
                    <button
                      key={hora}
                      onClick={() => !estaOcupado && setSelectedHour(hora)}
                      disabled={estaOcupado}
                      className={`p-3 rounded-xl border transition 
                        ${estaOcupado
                          ? "bg-red-500 text-white opacity-70 cursor-not-allowed"
                          : selectedHour === hora
                            ? "bg-black text-white"
                            : "bg-white text-black hover:bg-gray-100"
                        }`}
                    >
                      {hora} {estaOcupado && "(OCUPADO)"}
                    </button>
                  );
                })}
              </div>

              {selectedHour && (
                <button
                  onClick={async () => {
                    const fechaISO = format(selectedDay, "yyyy-MM-dd");

                    // CORRECCIÓN: Usar supabaseClient en lugar de supabase
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
                  className="mt-6 w-full text-center px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Reservar turno
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}