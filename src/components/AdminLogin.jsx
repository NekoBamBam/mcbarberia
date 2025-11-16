import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [pass, setPass] = useState("");
  const navigate = useNavigate();   // 👈 ACÁ va, adentro del componente

  function handleLogin(e) {
    e.preventDefault();

    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

    if (pass === ADMIN_PASS) {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin"); // 👈 redirige sin recargar la app
    } else {
      alert("Contraseña incorrecta");
    }
  }

  return (
    <div className="p-4 max-w-sm mx-auto bg-[#1a1d23] text-white rounded mt-10">
      <h2 className="text-xl font-bold mb-4">Acceso administrador</h2>

      <form onSubmit={handleLogin}>
        <input
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full p-2 rounded bg-[#30343a] mb-3"
        />

        <button
          type="submit"
          className="bg-blue-500 w-full py-2 rounded font-bold"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
