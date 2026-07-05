import { createContext, useContext, useState, useCallback } from "react";

const ProjectContext = createContext(null);

// Sentinela persistido para "Todos os Projetos" — distingue a escolha explícita do
// usuário (não auto-selecionar) de "nada selecionado ainda" (auto-selecionar o 1º projeto)
const ALL_SENTINEL = "__all__";

export function ProjectProvider({ children }) {
  const [rawId, setRawId] = useState(
    () => localStorage.getItem("selectedProjectId") || null
  );

  const setSelectedProjectId = useCallback((id) => {
    const value = id || ALL_SENTINEL;
    localStorage.setItem("selectedProjectId", value);
    setRawId(value);
  }, []);

  const selectedProjectId = rawId === ALL_SENTINEL ? null : rawId;
  const isAllProjects = rawId === ALL_SENTINEL;

  return (
    <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId, isAllProjects }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
