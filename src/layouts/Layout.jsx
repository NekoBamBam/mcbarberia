import React from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router";
import BackToTopButton from "../components/BackToTopButton";

function Layout() {
  return (
    <div className="w-full">
      <header>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <Footer />
      </footer>
      <BackToTopButton />
    </div>
  );
}

export default Layout;
