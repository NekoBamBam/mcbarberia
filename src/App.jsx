import "./App.css";
import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./layouts/Layout";
import AdminPanel from "./components/AdminPanel";

function App() {
  return (
    <HashRouter>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>

        {/* PANEL ADMIN */}
        <Route path="/admin" element={<AdminPanel />} />

      </Routes>
    </HashRouter>
  );
}

export default App;
