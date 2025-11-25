// HorarioItem.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function HorarioItem({ fecha, hora, horario, onEliminar, onOcupar, onLiberar, refresh }) {
  // hora: string (HH:MM) - kept for compatibility with your original usage
  // horario: optional {id, hora} if you pass the object instead
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    async function check() {
      if (!fecha) return setOcupado(false);

      // Prefer horario.id if está disponible
      if (horario && horario.id) {
        const { data } = await supabase
          .from("reservations")
          .select("id")
          .eq("fecha", fecha)
          .eq("hora_id", horario.id)
          .limit(1)
          .maybeSingle();
        setOcupado(!!data);
        return;
      }

      // fallback by hora string
      const { data } = await supabase
        .from("reservations")
        .select("id")
        .eq("fecha", fecha)
        .eq("hora", hora)
        .limit(1)
        .maybeSingle();
      setOcupado(!!data);
    }
    check();
  }, [fecha, hora, horario, refresh]);

  return (
    <div className={`px-3 py-1 rounded flex items-center gap-2 ${ocupado ? "bg-red-700" : "bg-gray-700"}`}>
      <span>
        { (horario && horario.hora) || hora } {ocupado && "(OCUPADO)"}
      </span>

      <button className="text-red-400" onClick={() => onEliminar(hora)}>
        ✕
      </button>

      {!ocupado ? (
        <button className="text-yellow-400" onClick={() => onOcupar(fecha, horario || hora)}>
          Ocupar
        </button>
      ) : (
        <button className="text-green-400" onClick={() => onLiberar(fecha, horario || hora)}>
          Liberar
        </button>
      )}
    </div>
  );
}
