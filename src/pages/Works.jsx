import logo2 from "../assets/logo2.jpg"
import React from "react";

export default function InstagramFeed() {
  return (
    <div className="w-full bg-[#959593] " id="trabajos">
      <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-4 border-b pb-6 mb-6">
          <img
            src={logo2}
            alt="MC Barbería"
            className="w-16 h-16 rounded-full border"
          />
          <div className="flex-1">
            <h2 className="text-lg text-black font-bold">@_mc.barberia</h2>
            <p className="text-gray-500 text-sm">Martin Coria
              Cuenta Principal: <a href="https://www.instagram.com/martingelp/" className="text-blue-500"> @martingelp</a>
              </p>
          </div>
          <a
            href="https://www.instagram.com/_mc.barberia/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            Seguir
          </a>
        </div>

        <iframe
          src="https://snapwidget.com/embed/1108725"
          title="Instagram Feed"
          className="w-full rounded-lg"
          style={{ border: "none", overflow: "hidden", width: "100%", height: "550px" }}
          scrolling="no"
          frameBorder="0"
          allowTransparency={true}
        />
      </div>
    </div>
  );
}
