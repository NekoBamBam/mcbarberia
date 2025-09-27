import React from "react";
import billy from "../assets/billy.jpg";
import fraters from "../assets/fraters.jpg";
import omar from "../assets/omar.jpg";
import mari from "../assets/mari.jpg";
import Services from "./Services";

const links = [
  { name: "Fraters", img: fraters },
  { name: "Coria F. O.", img: omar },
  { name: "Carabajal M. R.", img: mari },
  { name: "Negrete O. C.", img: billy },
];

function Footer() {
  return (
    <div className="bg-[#5E503F]">
      <Services />
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
      </section>


    </div>
  );
}

export default Footer;
