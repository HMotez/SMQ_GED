import { Routes, Route } from "react-router-dom";
import CreateDocument from "./pages/CreateDocument";
import DocumentList from "./pages/DocumentList";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateDocument />} />
      <Route path="/list" element={<DocumentList />} />
    </Routes>
  );
}
