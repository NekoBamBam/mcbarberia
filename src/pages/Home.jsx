import React from "react";
import martin from "../assets/martin.jpg";
import fondo2 from "../assets/fondo3.jpg";
import Works from "./Works";
import "react-day-picker/dist/style.css";

function Home() {
  const scrollToSection = () => {
    const section = document.getElementById("turnos");
    section?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToSection2 = () => {
    const section = document.getElementById("sobre-mi");
    section?.scrollIntoView({ behavior: "smooth" });
  };


  return (
    <div className="bg-gray-200">
      <div className="relative min-h-screen ">
        <img
          className="h-screen w-full object-cover opacity-75"
          src={fondo2}
          alt=""
        />
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl font-imbue uppercase tracking-widest text-[#222] text-center animate-zoom-blur">
            Magnum Class
          </h1>


          <h2 className="text-xl sm:text-4xl text-white font-imbue mt-16 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            DEDICACION Y COMPROMISO!
          </h2>
          <button
            onClick={scrollToSection}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-300 text-base sm:text-lg mt-16"
          >
            Turnos
          </button>
          <div onClick={scrollToSection2} className="mt-10 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              fill="currentColor"
              className="bi bi-chevron-compact-down text-white  hover:text-gray-400 transition"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M1.553 6.776a.5.5 0 0 1 .67-.223L8 9.44l5.776-2.888a.5.5 0 1 1 .448.894l-6 3a.5.5 0 0 1-.448 0l-6-3a.5.5 0 0 1-.223-.67"
              />
            </svg>
          </div>
        </div>
      </div>

      <div
        id="sobre-mi"
        className="min-h-screen bg-[#363634] flex items-center justify-center p-8"
      >
        <div className="bg-[#363634] flex flex-col md:flex-row items-center justify-center p-8 gap-8">
          <div className="text-center md:text-left md:w-1/2">
            <h1
              className="text-4xl font-bold text-white text-black mb-4 font-imbue"
              style={{ transform: "scaleY(2)" }}
            >
              SOBRE MI
            </h1>
            <p className="text-lg text-gray-600 text-white">
              Soy un barbero apasionado y dedicado,
               con habilidades refinadas en cortes de cabello y un <a className="text-cyan-500"> Compromiso Inquebrantable </a>
                con la calidad. Mi pasión por la barbería se refleja en cada corte, cada diseño
                 y cada sonrisa de satisfacción de mis clientes. Me esfuerzo por <a className="text-cyan-500"> Crear Experiencias </a>
                  personalizadas y únicas, siempre buscando innovar y mejorar. Mi objetivo es hacer
                   que cada cliente se sienta confiado y satisfecho con su apariencia. 
                  <a className="text-cyan-500" > ¡Bienvenido a mi barbería!</a>
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img className="rounded-lg h-64 w-64" src={martin} alt="" />
          </div>
        </div>
      </div>
      <section id="trabajos" className="flex items-center justify-center p-2 h-screen w-screen lg:h-full lg:w-full bg-[#585856] ">
        <Works />
      </section>
    </div>
  );
}

export default Home;