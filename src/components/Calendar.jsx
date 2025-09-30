import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

export default function Turnos() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  // Definís horarios disponibles (ejemplo 10 a 18hs cada 1h)
  const horarios = [
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Calendario */}
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        disabled={{
          before: new Date(), // no permite días anteriores
        }}
      />

      {/* Horarios */}
      {selectedDay && (
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-center mb-4">
            Horarios disponibles para {format(selectedDay, "dd/MM/yyyy")}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {horarios.map((hora) => (
              <button
                key={hora}
                onClick={() => setSelectedHour(hora)}
                className={`p-3 rounded-xl border 
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
        </div>
      )}

      {/* Confirmación */}
      {selectedDay && selectedHour && (
        <div className="mt-6 text-center">
          <p className="font-semibold">
            Turno seleccionado:{" "}
            <span className="text-blue-600">
              {format(selectedDay, "dd/MM/yyyy")} a las {selectedHour}
            </span>
          </p>
          <button
            onClick={() => alert("Turno confirmado ✅")}
            className="mt-4 px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
          >
            Confirmar turno
          </button>
        </div>
      )}
    </div>
  );
}
