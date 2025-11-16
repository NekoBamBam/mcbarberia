import React, { useState } from "react";
import logo from "../assets/logo2.jpg";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  // ---------- ACCESO SECRETO ----------
  const handleSecretTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;

      if (newCount >= 3) {
  setTimeout(() => {
    navigate("/admin");
  }, 0);
}


      return newCount;
    });

    // Resetea los taps si pasa 1.5 segundos sin tocar de nuevo
    setTimeout(() => setTapCount(0), 1500);
  };
  // -----------------------------------

  return (
    <nav className="bg-[#f4f4f4] border-b border-gray-200 px-6 py-4 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between md:justify-center">
        
        {/* LOGO con acceso oculto */}
        <div className="h-16 w-16">
          <img
            src={logo}
            alt="Logo"
            className="logo-move"
            onClick={handleSecretTap} // 👈 Secreto acá
          />
        </div>

        <div className="hidden md:flex space-x-8 absolute justify-center w-full">
          <button
            onClick={() => scrollToSection("sobre-mi")}
            className="text-black cursor-pointer hover:text-red-500 font-serif"
          >
            SOBRE MI
          </button>
          <button
            onClick={() => scrollToSection("trabajos")}
            className="text-black cursor-pointer hover:text-red-500 font-serif"
          >
            TRABAJOS
          </button>
          <button
            onClick={() => scrollToSection("turnos")}
            className="text-black cursor-pointer hover:text-red-500 font-serif"
          >
            TURNOS
          </button>
        </div>

        {/* Botón menú hamburguesa celular */}
        <div className="md:hidden">
          <button className="text-black" onClick={() => setOpen(!open)}>
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Menú abierto celular */}
      {open && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#dededc] shadow-md flex flex-col items-center space-y-4 py-4">
          <button
            onClick={() => scrollToSection("sobre-mi")}
            className="text-black"
          >
            SOBRE MI
          </button>
          <button
            onClick={() => scrollToSection("trabajos")}
            className="text-black"
          >
            TRABAJOS
          </button>
          <button
            onClick={() => scrollToSection("turnos")}
            className="text-black"
          >
            TURNOS
          </button>
        </div>
      )}
    </nav>
  );
}
