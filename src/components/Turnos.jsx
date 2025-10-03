import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React from "react";

export default function Turnos() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  // Días disponibles (ejemplo: de lunes a sábado)
  const diasDisponibles = [1, 2, 3, 4, 5, 6]; // 0 = domingo, 6 = sábado

  // Horarios por día (ejemplo fijo)
  const horarios = [
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  const whatsappNumber = "2216282112"; 

  // Genera el link para WhatsApp
  const generarLink = () => {
    if (!selectedDay || !selectedHour) return "#";
    const fecha = format(selectedDay, "dd/MM/yyyy");
    const mensaje = `Hola, quiero un turno para el día ${fecha} a las ${selectedHour}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
   <div 
  id="turnos" 
  className="flex flex-col items-center bg-black gap-6 p-6"
>
  <div className="flex flex-col md:flex-row md:items-start md:gap-10 md:justify-center w-full max-w-5xl">
    
    {/* Calendario */}
    <DayPicker
      mode="single"
      selected={selectedDay}
      onSelect={setSelectedDay}
      disabled={{ before: new Date() }}
      modifiers={{ available: { daysOfWeek: diasDisponibles } }}
      className="p-4 border rounded-xl shadow-md bg-white text-black mx-auto"
      styles={{
        caption: { color: "black", fontWeight: "bold" },
        head: { color: "black" },
        day: { color: "black" },
        day_selected: { backgroundColor: "#000", color: "#fff" },
        day_disabled: { color: "#ccc" },
        day_today: { border: "1px solid #000" },
      }}
      locale={es}
    />

    {/* Horarios */}
    {selectedDay && (
      <div className="mt-6 md:mt-0 w-full md:w-1/2 max-w-md">
        <h2 className="text-xl font-bold text-center md:text-left mb-4 text-white">
          Horarios disponibles para {format(selectedDay, "dd/MM/yyyy")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {horarios.map((hora) => (
            <button
              key={hora}
              onClick={() => setSelectedHour(hora)}
              className={`p-3 rounded-xl border transition
                ${
                  selectedHour === hora
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
            >
              {hora}
            </button>
          ))}
        </div>

        {/* Confirmación y WhatsApp */}
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
