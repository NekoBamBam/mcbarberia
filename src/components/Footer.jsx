import React from "react";
import Services from "./Services";
import { Calendar } from "lucide-react";
import Turnos from "./Turnos";


function Footer() {
  return (
    <div className="bg-[#5E503F]">
      <Turnos/>
      <section className="bg-[#3e3e3c] h-12 flex items-center justify-center text-sm relative">
        <p className="text-white">© MAGNUM CLASS BARBER 2025</p>
        <a
          href="https://github.com/NekoBamBam"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 text-xs left-4 text-white hover:underline"
        >
          Coria Franco Nicolas
        </a>
        <a
          href="https://github.com/Lawcito"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 text-xs right-4 text-white hover:underline"
        >
          Negrete Emir Alejo
        </a>
      </section>


    </div>
  );
}

export default Footer;
