import { useEffect, useState } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, startOfWeek, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";

export default function Turnos() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [config, setConfig] = useState(null);

  const whatsappNumber = "2216282112";

  // 🔗 URL del CSV publicado desde Google Sheets
  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAlc4rtVEfhi8qcrYpT7GzIqnN_0cRpNGni6hH4MDy59iBMzgvKGuO1oS0vTu61AW0O1WQRn73M_wa/pub?output=csv";

  // util: intenta parsear string de fecha en varios formatos
  const parseSemanaString = (str) => {
    if (!str) return null;
    const s = str.trim();
    // Intentar ISO yyyy-MM-dd
    let d = parse(s, "yyyy-MM-dd", new Date());
    if (isValid(d)) return d;
    // Intentar dd/MM/yyyy
    d = parse(s, "dd/MM/yyyy", new Date());
    if (isValid(d)) return d;
    // Intentar parse nativo (último recurso)
    const n = new Date(s);
    if (!isNaN(n)) return n;
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(sheetURL);
        const text = await res.text();

        // separar lineas, respetando posibles \r\n
        const lines = text.split(/\r?\n/).filter(Boolean);
        const rows = lines.map((r) => r.split(","));
        const data = rows.slice(1); // ignorar encabezados

        const semanas = {};
        data.forEach((row) => {
          if (!row || !row[0]) return;
          const rawSemana = row[0].trim();
          const parsed = parseSemanaString(rawSemana);
          if (!parsed) {
            console.warn("No se pudo parsear la fecha de semana:", rawSemana);
            return;
          }
          // clave usada en la app: inicio de semana (lunes) en yyyy-MM-dd
          const semanaKey = format(startOfWeek(parsed, { weekStartsOn: 1 }), "yyyy-MM-dd");

          // días y horarios: usamos ; dentro de celdas en la hoja
          const dias = row[1]?.split(";").map((d) => d.trim().toLowerCase()) || [];
          const horarios = row.slice(2).join(",").split(";").map((h) => h.trim()).filter(Boolean);

          semanas[semanaKey] = { dias, horarios };
        });

        setConfig(semanas);
        console.log("config cargada:", semanas);
      } catch (err) {
        console.error("Error cargando Google Sheet:", err);
      }
    };

    fetchData();
  }, [sheetURL]);

  if (!config) return <p className="text-white">Cargando disponibilidad...</p>;

  const diaANumero = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  };

  // normaliza texto (quita tildes, mayúsculas, espacios)
  const normalizar = (texto) =>
    (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const baseDate = selectedDay || new Date();
  const inicioSemana = startOfWeek(baseDate, { weekStartsOn: 1 });
  const keySemana = format(inicioSemana, "yyyy-MM-dd");

  const semanaActual = config[keySemana];

  // Mapear días a números, permitiendo 0
  const diasDisponibles = semanaActual
    ? semanaActual.dias
        .map((d) => diaANumero[normalizar(d)])
        .filter((d) => d !== undefined && d !== null)
    : [];

  // todos los días de la semana
  const todosLosDias = [0, 1, 2, 3, 4, 5, 6];
  const diasNoDisponibles = todosLosDias.filter((d) => !diasDisponibles.includes(d));

  const horarios = semanaActual ? semanaActual.horarios : [];

  // DEBUG: loguear para ver qué está llegando
  console.log("keySemana:", keySemana);
  console.log("semanaActual:", semanaActual);
  console.log("diasDisponibles:", diasDisponibles);
  console.log("diasNoDisponibles:", diasNoDisponibles);

  // proteger selección: si el usuario hace click en un día no disponible, ignorar
  const handleSelect = (day) => {
    if (!day) {
      setSelectedDay(null);
      return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);

    const dow = day.getDay();
    if (dayStart < todayStart) {
      // fecha pasada: ignorar
      return;
    }
    if (diasNoDisponibles.includes(dow)) {
      // día no disponible: ignorar
      return;
    }
    setSelectedDay(day);
  };

  const generarLink = () => {
    if (!selectedDay || !selectedHour) return "#";
    const fecha = format(selectedDay, "dd/MM/yyyy");
    const mensaje = `Hola, quiero un turno para el día ${fecha} a las ${selectedHour}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <div id="turnos" className="flex flex-col items-center bg-black gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-start md:gap-10 md:justify-center w-full max-w-5xl">
        {/* Calendario */}
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={handleSelect}
          disabled={[
            { before: new Date() },
            { daysOfWeek: diasNoDisponibles },
          ]}
          modifiers={{
            notAvailable: { daysOfWeek: diasNoDisponibles },
            available: { daysOfWeek: diasDisponibles },
          }}
          modifiersStyles={{
            notAvailable: {
              color: "red",
              opacity: 0.6,
              textDecoration: "line-through",
              backgroundColor: "#fff0f0",
            },
            available: {
              // estilo opcional para días disponibles
              // backgroundColor: "#f0fff4"
            },
          }}
          className="p-4 border rounded-xl shadow-md bg-white text-black mx-auto"
          styles={{
            caption: { color: "black", fontWeight: "bold" },
            head: { color: "black" },
            day: { color: "black" },
            day_selected: { backgroundColor: "#000", color: "#fff" },
            day_disabled: { color: "#ccc", cursor: "not-allowed" },
            day_today: { border: "1px solid #000" },
          }}
          locale={es}
        />

        {/* Horarios */}
        {selectedDay && horarios.length > 0 && (
          <div className="mt-6 md:mt-0 w-full md:w-1/2 max-w-md">
            <h2 className="text-xl font-bold text-center md:text-left mb-4 text-white">
              Horarios disponibles para {format(selectedDay, "dd/MM/yyyy")}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {horarios.map((hora) => (
                <button
                  key={hora}
                  onClick={() => setSelectedHour(hora)}
                  className={`p-3 rounded-xl border transition ${selectedHour === hora
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {hora}
                </button>
              ))}
            </div>

            {selectedHour && (
              <a
                href={generarLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block text-center px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                Enviar turno por WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
