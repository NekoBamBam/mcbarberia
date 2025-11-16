import React from "react";
import { Scissors, Sparkles, Bath } from "lucide-react"; // íconos bonitos

const services = [
  {
    icon: <Scissors size={40} className="text-cyan-400" />,
    title: "Corte de cabello",
    description: "Estilo personalizado con terminaciones precisas para un look impecable.",
  },
  {
    icon: <Sparkles size={40} className="text-cyan-400" />,
    title: "Arreglo de barba",
    description:
      "Arreglo de barba. Terminaciones a navaja y productos para el cuidado de tu piel y barba.",
  },
  {
    icon: <Bath size={40} className="text-cyan-400" />,
    title: "Lavado de cabeza",
    description:
      "Limpieza profunda y revitalizante para un cabello sano y fresco.",
  },
];

export default function Services() {
  return (
    <section id="servicios" className="bg-[#1f1f1f] py-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* título de sección */}
        <h2 className="text-3xl font-bold text-white mb-10">
          Nuestros Servicios
        </h2>

        {/* grid de 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-transparent border border-cyan-400 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 transition duration-300 flex flex-col items-center text-center"
            >
              <div className="mb-4">{service.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">
                {service.title}
              </h3>
              <p className="text-gray-300 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
