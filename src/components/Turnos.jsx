import { useEffect, useState } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, startOfWeek, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";

export default function Turnos() {
  const [selectedBarbero, setSelectedBarbero] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [config, setConfig] = useState(null);

  const sheetURLs = {
    martin: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAlc4rtVEfhi8qcrYpT7GzIqnN_0cRpNGni6hH4MDy59iBMzgvKGuO1oS0vTu61AW0O1WQRn73M_wa/pub?output=csv",
    emi: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf3kymDXOXNo4iF7ER8NQRI3QP40RhLRqUdNz7oYcIw9YTjQi0ipr5a7kjVW8VOMxVqW-yPnC-n1d/pub?output=csv",
  };

  const numeros = {
    martin: "2216282112",
    emi: "2215115752",
  };

  const whatsappNumber = numeros[selectedBarbero];

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

  useEffect(() => {
    if (!selectedBarbero) return; // solo cargar cuando se elija barbero

    const fetchData = async () => {
      try {
        const res = await fetch(sheetURLs[selectedBarbero]);
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const rows = lines.map((r) => r.split(","));
        const data = rows.slice(1);

        const semanas = {};
        data.forEach((row) => {
          const rawSemana = row[0]?.trim();
          const parsed = parseSemanaString(rawSemana);
          if (!parsed) return;
          const semanaKey = format(startOfWeek(parsed, { weekStartsOn: 1 }), "yyyy-MM-dd");
          const dias = row[1]?.split(";").map((d) => d.trim().toLowerCase()) || [];
          const horarios = row
            .slice(2)
            .join(",")
            .split(";")
            .map((h) => h.trim())
            .filter(Boolean);
          semanas[semanaKey] = { dias, horarios };
        });
        setConfig(semanas);
        setSelectedDay(null);
        setSelectedHour(null);
      } catch (err) {
        console.error("Error cargando Google Sheet:", err);
      }
    };

    fetchData();
  }, [selectedBarbero]);

  if (!selectedBarbero) {
    return (
      <div id="turnos" className="flex flex-col items-center gap-6 p-10 bg-black text-white">
        <h2 className="text-2xl font-bold">Elegí tu barbero</h2>
        <div className="flex gap-6">
          <button
            onClick={() => setSelectedBarbero("martin")}
            className="px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-200 font-semibold"
          >
            Martin
          </button>
          <button
            onClick={() => setSelectedBarbero("emi")}
            className="px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-200 font-semibold"
          >
            Emi
          </button>
        </div>
      </div>
    );
  }

  if (!config) return <p className="text-white text-center mt-10">Cargando disponibilidad...</p>;

  // mapeo y estilos igual que antes
  const diaANumero = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
    jueves: 4, viernes: 5, sabado: 6, sábado: 6,
  };

  const normalizar = (texto) =>
    (texto || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const baseDate = selectedDay || new Date();
  const inicioSemana = startOfWeek(baseDate, { weekStartsOn: 1 });
  const keySemana = format(inicioSemana, "yyyy-MM-dd");

  const semanaActual = config[keySemana];
  const diasDisponibles = semanaActual
    ? semanaActual.dias.map((d) => diaANumero[normalizar(d)]).filter((d) => d !== undefined)
    : [];
  const diasNoDisponibles = [0, 1, 2, 3, 4, 5, 6].filter((d) => !diasDisponibles.includes(d));
  const horarios = semanaActual ? semanaActual.horarios : [];

  const handleSelect = (day) => {
    if (!day) return setSelectedDay(null);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (dayStart < todayStart) return;
    if (diasNoDisponibles.includes(day.getDay())) return;
    setSelectedDay(day);
  };

  const generarLink = () => {
    if (!selectedDay || !selectedHour) return "#";
    const fecha = format(selectedDay, "dd/MM/yyyy");
    const mensaje = `Hola, quiero un turno con ${selectedBarbero} para el día ${fecha} a las ${selectedHour}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <div className="flex flex-col items-center bg-black gap-6 p-6 text-white">
      <button
        onClick={() => setSelectedBarbero(null)}
        className="self-start px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
      >
        ← Cambiar barbero
      </button>

      <h2 className="text-2xl font-bold">Turnos con {selectedBarbero}</h2>

      <div className="flex flex-col md:flex-row md:items-start md:gap-10 md:justify-center w-full max-w-5xl">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={handleSelect}
          disabled={[{ before: new Date() }, { daysOfWeek: diasNoDisponibles }]}
          modifiers={{
            notAvailable: { daysOfWeek: diasNoDisponibles },
            available: { daysOfWeek: diasDisponibles },
          }}
          modifiersStyles={{
            notAvailable: { color: "red", opacity: 0.6, textDecoration: "line-through" },
          }}
          className="p-4 border rounded-xl shadow-md bg-white text-black mx-auto"
          styles={{
            caption: { color: "black", fontWeight: "bold" },
            head: { color: "black" },
            day: { color: "black" },
            day_selected: { backgroundColor: "#000", color: "#fff" },
            day_disabled: { color: "#ccc" },
          }}
          locale={es}
        />

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
