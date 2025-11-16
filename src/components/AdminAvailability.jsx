import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function AdminAvailability() {
  const [day, setDay] = useState("lunes");
  const [hours, setHours] = useState([]);

  const days = ["lunes","martes","miércoles","jueves","viernes","sábado"];

  useEffect(() => {
    loadHours();
  }, [day]);

  async function loadHours() {
    const { data, error } = await supabase
      .from("availability")
      .select("hours")
      .eq("day", day)
      .single();

    if (!error && data) setHours(data.hours);
  }

  async function saveHours() {
    const { error } = await supabase
      .from("availability")
      .update({ hours })
      .eq("day", day);

    if (!error) alert("Guardado!");
  }

  function addHour() {
    const newHour = prompt("Nueva hora (ej: 10:30)");
    if (newHour) setHours([...hours, newHour]);
  }

  function removeHour(hora) {
    setHours(hours.filter((h) => h !== hora));
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Horario del día</h2>

      <select value={day} onChange={(e) => setDay(e.target.value)}>
        {days.map((d) => <option key={d}>{d}</option>)}
      </select>

      <div className="mt-4">
        <h3 className="text-xl mb-2">Horas</h3>

        {hours.map((h) => (
          <div key={h} className="flex gap-2 items-center">
            <span>{h}</span>
            <button onClick={() => removeHour(h)}>❌</button>
          </div>
        ))}

        <button className="mt-3 p-2 bg-green-600" onClick={addHour}>
          Agregar hora
        </button>
      </div>

      <button className="mt-6 p-3 bg-blue-600" onClick={saveHours}>
        Guardar cambios
      </button>
    </div>
  );
}
