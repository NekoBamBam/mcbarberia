import React, { useEffect, useRef } from "react";

export default function Maps() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.google) return;

    // Ubicación del local
    const local = { lat: -34.92145, lng: -57.95586 }; // ← reemplazar por la tuya

    const map = new window.google.maps.Map(mapRef.current, {
      center: local,
      zoom: 16,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#2c2c2c" }]
        }
      ]
    });

    // Marcador custom
    const marker = new window.google.maps.Marker({
      position: local,
      map,
      icon: {
        url: "/icono-barberia.png", // <- tu icono en /public
        scaledSize: new window.google.maps.Size(50, 50),
      }
    });

    // Popup
    const info = new window.google.maps.InfoWindow({
      content: `
        <div style="font-size:14px; font-weight:600;">
          <strong>MC Barbería</strong> <br />
          Calle 123, La Plata <br/>
          <button id="goBtn" 
            style="margin-top:6px; padding:6px 10px; background:#000; color:white; border-radius:6px; cursor:pointer;">
            Cómo llegar
          </button>
        </div>
      `,
    });

    // Abrir popup al tocar el marcador
    marker.addListener("click", () => info.open(map, marker));

    // Delegar el botón después de renderizar el popup
    window.google.maps.event.addListener(info, "domready", () => {
      document.getElementById("goBtn").onclick = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`;
        window.open(url, "_blank");
      };
    });
  }, []);

  return (
    <div className="w-full flex justify-center mt-6">
      <div className="w-full max-w-3xl h-[60vh] rounded-2xl overflow-hidden shadow-xl">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
