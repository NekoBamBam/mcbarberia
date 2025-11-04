import React from "react";
import barber1 from "../assets/barber1.png";
import barber2 from "../assets/barber2.png";
import barber3 from "../assets/barber3.png";
import barber4 from "../assets/barber4.png";
import barber5 from "../assets/barber5.png";
import barber6 from "../assets/fondo2.jpg";
import logo from "../assets/logo2.jpg";

const BarberInstagram = () => {
  const posts = [
    {
      id: 1,
      img: barber1,
      link: "https://www.instagram.com/p/DOzaSsZjfA8/?utm_source=ig_web_copy_link",
      hover: "#fade #barbershop",
    },
    {
      id: 2,
      img: barber2,
      link: "https://www.instagram.com/reel/DOmUMxnjdfi/?utm_source=ig_web_copy_link",
      hover: "#fade #barbershop",
    },
    {
      id: 3,
      img: barber3,
      link: "https://www.instagram.com/reel/DOPQBG7jSLO/?utm_source=ig_web_copy_link",
      hover: "#fade #barberia #barbershop",
    },
    {
      id: 4,
      img: barber4,
      link: "https://www.instagram.com/reel/DNi3IeRNS_x/?utm_source=ig_web_copy_link",
      hover: "#barberia #barbershop #fade",
    },
    {
      id: 5,
      img: barber5,
      link: "https://www.instagram.com/reel/DMl5Z71tI1R/?utm_source=ig_web_copy_link",
      hover: "#barbershop #barberia #taperfade",
    },
    {
      id: 6,
      img: barber6,
      link: "https://www.instagram.com/reel/DMl5Z71tI1R/?utm_source=ig_web_copy_link",
    },
  ];

  return (
  <section className="w-full md:w-3/4 lg:w-2/3 mx-auto bg-gray-50 border border-gray-200 rounded-xl text-black p-5 shadow-md">

      {/* Header */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between gap-4 px-6 py-5">
        {/* Profile */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0 rounded-full border border-gray-300 overflow-hidden">
            <img src={logo} alt="logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">@salonmagnumclass</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cuenta Principal:{" "}
              <a
                href="https://www.instagram.com/martingelp/"
                target="_blank"
                className="text-blue-500"
              >
                @martingelp
              </a>
            </p>
          </div>
        </div>

        {/* Button */}
        <a
          href="https://www.instagram.com/salonmagnumclass/"
          target="_blank"
          className="w-full sm:w-auto"
        >
          <button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-md transition">
            Seguir
          </button>
        </a>
      </div>

      <hr className="border-gray-200" />

      {/* Gallery */}
     <div className="grid grid-cols-3 gap-1 bg-gray-100 pb-4 rounded-b-xl">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group aspect-square bg-black"
          >
            <img
              src={post.img}
              alt={`Post ${post.id}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-90 transition flex items-center justify-center">
              <p className="text-white text-xs font-medium text-center px-2">
                {post.hover}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default BarberInstagram;
