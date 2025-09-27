import React from "react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";

export default function WhatsAppButton() {
    const phoneNumber = "2215691249";
    const message = "Hola Martin, necesito un turno";

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <a
                href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-tooltip-id="whatsapp-tooltip"
            >
                <motion.img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                    alt="WhatsApp"
                    className="w-14 h-14 rounded-full shadow-lg cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                />
            </a>


            <Tooltip
                id="whatsapp-tooltip"
                place="left"
                className="!bg-green-600 !text-white !px-3 !py-1 !rounded-lg text-sm"
            >
                ¿Necesitás un turno? ¡Escribinos!
            </Tooltip>
        </div>
    );
}
