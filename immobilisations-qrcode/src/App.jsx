import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { CompanyProvider } from "./contexts/CompanyContext.jsx";
import Login from "./screens/Login.jsx";
import Signup from "./screens/Signup.jsx";
import AdminDashboard from "./screens/AdminDashboard.jsx";
import CampaignSelect from "./screens/CampaignSelect.jsx";
import Scan from "./screens/Scan.jsx";
import Dashboard from "./screens/backoffice/Dashboard.jsx";
import AssetsList from "./screens/backoffice/AssetsList.jsx";
import Locations from "./screens/backoffice/Locations.jsx";
import GenerateQr from "./screens/backoffice/GenerateQr.jsx";
import CampaignResults from "./screens/backoffice/CampaignResults.jsx";

function Private({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="screen screen-center">Chargement...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// Un responsable de cabinet doit atterrir sur le backoffice (c'est lui qui
// configure les clients, immobilisations, campagnes) — un agent de terrain
// reste sur l'écran de scan, son usage principal.
function Home() {
  const { profile, loading } = useAuth();
  if (loading || !profile) return <div className="screen screen-center">Chargement...</div>;
  if (profile.role === "responsable") return <Navigate to="/backoffice" replace />;
  return <CampaignSelect />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Private><Home /></Private>} />
      <Route path="/scanner" element={<Private><CampaignSelect /></Private>} />
      <Route path="/scan/:campaignId" element={<Private><Scan /></Private>} />

      <Route path="/backoffice" element={<Private><CompanyProvider><Dashboard /></CompanyProvider></Private>} />
      <Route path="/backoffice/assets" element={<Private><CompanyProvider><AssetsList /></CompanyProvider></Private>} />
      <Route path="/backoffice/locations" element={<Private><CompanyProvider><Locations /></CompanyProvider></Private>} />
      <Route path="/backoffice/qrcodes" element={<Private><CompanyProvider><GenerateQr /></CompanyProvider></Private>} />
      <Route path="/backoffice/campaigns/:campaignId/results" element={<Private><CompanyProvider><CampaignResults /></CompanyProvider></Private>} />

      <Route path="/admin" element={<Private><AdminDashboard /></Private>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
