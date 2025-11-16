import React,{ useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function HorarioItem({ fecha, hora, onEliminar, onOcupar, onLiberar }) {
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase
        .from("reservations")
        .select("id")
        .eq("fecha", fecha)
        .eq("hora", hora)
        .maybeSingle();

      setOcupado(!!data);
    }
    check();
  }, [fecha, hora]);

  return (
    <div
      className={`px-3 py-1 rounded flex items-center gap-2 ${
        ocupado ? "bg-red-700" : "bg-gray-700"
      }`}
    >
      <span>
        {hora} {ocupado && "(OCUPADO)"}
      </span>

      <button className="text-red-400" onClick={() => onEliminar(hora)}>
        ✕
      </button>

      {!ocupado ? (
        <button className="text-yellow-400" onClick={() => onOcupar(fecha, hora)}>
          Ocupar
        </button>
      ) : (
        <button className="text-green-400" onClick={() => onLiberar(fecha, hora)}>
          Liberar
        </button>
      )}
    </div>
  );
}
