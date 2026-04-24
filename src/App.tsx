/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import IntegrationsList from "./pages/IntegrationsList";
import IntegrationDetail from "./pages/IntegrationDetail";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import { MCPProvider } from "./context/MCPContext";

export default function App() {
  return (
    <MCPProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/integrations" element={<IntegrationsList />} />
            <Route path="/integrations/:id" element={<IntegrationDetail />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" richColors />
      </Router>
    </MCPProvider>
  );
}

