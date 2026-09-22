import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "./AuthContext.jsx";

// Le dossier client actif dans le backoffice — un cabinet gère plusieurs
// clients, le responsable choisit celui qu'il consulte.
const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("companies")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        setCompanies(data || []);
        if (data?.length && !companyId) setCompanyId(data[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return (
    <CompanyContext.Provider value={{ companies, companyId, setCompanyId, setCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
