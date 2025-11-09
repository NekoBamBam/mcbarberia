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

  const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAlc4rtVEfhi8qcrYpT7GzIqnN_0cRpNGni6hH4MDy59iBMzgvKGuO1oS0vTu61AW0O1WQRn73M_wa/pub?output=csv";

  const whatsappNumber = "2215691249";

  const parseSemanaString = (str) => {
    if (!str) return null;
    const s = str.trim();
    let d = parse(s, "yyyy-MM-dd", new Date());
    if (isValid(d)) return d;
    d = parse(s, "dd/MM/yyyy", new Date());
    if (isValid(d)) return d;
    const n = new Date(s);
    return !isNaN(n) ? n : null;
  };

  const normalizar = (texto) =>
    (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(sheetURL);
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const rows = lines.map((r) => r.split(","));
        const data = rows.slice(1); // omitir encabezado

        const semanas = {};
        data.forEach((row) => {
          const rawSemana = row[0]?.trim();
          const parsed = parseSemanaString(rawSemana);
          if (!parsed) return;

          const semanaKey = format(
            startOfWeek(parsed, { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          );
          const dia = normalizar(row[1] || "");
          const horarios = (row[2] || "")
            .split(";")
            .map((h) => h.trim())
            .filter(Boolean);

          if (!semanas[semanaKey]) semanas[semanaKey] = {};
          semanas[semanaKey][dia] = horarios;
        });

        setConfig(semanas);
        setSelectedDay(null);
        setSelectedHour(null);
      } catch (err) {
        console.error("Error cargando Google Sheet:", err);
      }
    };

    fetchData();
  }, []);

  if (!config)
    return <p className="text-white text-center mt-10">Cargando disponibilidad...</p>;

  const isNotAvailable = (day) => {
    const inicioSemana = startOfWeek(day, { weekStartsOn: 1 });
    const keySemana = format(inicioSemana, "yyyy-MM-dd");
    const semanaActual = config[keySemana];
    if (!semanaActual) return true;

    const nombreDia = normalizar(format(day, "EEEE", { locale: es }));
    const horarios = semanaActual[nombreDia];
    return !horarios || horarios.length === 0;
  };

  const handleSelect = (day) => {
    if (!day) return setSelectedDay(null);

    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (dayStart < todayStart) return; // No permitir días pasados

    if (isNotAvailable(day)) return; // No permitir días sin horarios

    setSelectedDay(day);
  };

  const horarios = (() => {
    if (!selectedDay) return [];
    const inicioSemana = startOfWeek(selectedDay, { weekStartsOn: 1 });
    const keySemana = format(inicioSemana, "yyyy-MM-dd");
    const semanaActual = config[keySemana];
    const nombreDia = normalizar(format(selectedDay, "EEEE", { locale: es }));
    return semanaActual?.[nombreDia] || [];
  })();

  const generarLink = () => {
    if (!selectedDay || !selectedHour) return "#";
    const fecha = format(selectedDay, "dd/MM/yyyy");
    const mensaje = `Hola Martin! Quiero un turno para el día ${fecha} a las ${selectedHour}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <div
      id="turnos"
      className="flex flex-col items-center bg-black gap-6 p-6 text-white"
    >
      <h2 className="text-2xl font-bold">Turnos</h2>

     <div className="flex flex-col md:flex-row md:items-start md:gap-10 md:items-center w-full max-w-5xl justify-center">
  <div className="flex justify-center w-full md:w-auto">
    <DayPicker
      mode="single"
      selected={selectedDay}
      onSelect={handleSelect}
      disabled={[{ before: new Date() }]}
      modifiers={{
        notAvailable: isNotAvailable,
      }}
      modifiersStyles={{
        notAvailable: {
          color: "red",
          opacity: 0.6,
          textDecoration: "line-through",
        },
      }}
      className="p-4 border rounded-xl shadow-md bg-white text-black"
      styles={{
        caption: { color: "black", fontWeight: "bold" },
        head: { color: "black" },
        day: { color: "black" },
        day_selected: { backgroundColor: "#000", color: "#fff" },
        day_disabled: { color: "#ccc" },
      }}
      locale={es}
    />
  </div>

  {selectedDay && horarios.length > 0 && (
    <div className="mt-6 md:mt-0 w-full md:w-1/2 max-w-md">
      <h3 className="text-xl font-bold mb-4 text-center md:text-left">
        Horarios disponibles para {format(selectedDay, "dd/MM/yyyy")}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {horarios.map((hora) => (
          <button
            key={hora}
            onClick={() => setSelectedHour(hora)}
            className={`p-3 rounded-xl border transition ${
              selectedHour === hora
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
