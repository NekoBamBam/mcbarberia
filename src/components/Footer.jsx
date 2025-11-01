import React from "react";
import Services from "./Services";
import { Calendar } from "lucide-react";
import Turnos from "./Turnos";


function Footer() {
  return (
    <div className="bg-[#5E503F]">
      <Turnos/>
      <section className="bg-[#EAE0D5] h-32 flex items-center justify-center text-sm relative">
        <p className="text-black">© CORIA MARTIN BARBERIA 2025</p>
        <a
          href="https://github.com/NekoBamBam"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 left-4 text-black hover:underline"
        >
          Coria Franco Nicolas
        </a>
        <a
          href="https://github.com/Lawcito"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-4 text-black hover:underline"
        >
          Negrete Emir Alejo
        </a>
      </section>


    </div>
  );
}

export default Footer;
