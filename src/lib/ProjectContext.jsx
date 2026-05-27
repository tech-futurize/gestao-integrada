import { createContext, useContext, useState, useCallback } from "react";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [selectedProjectId, setSelectedProjectIdState] = useState(
    () => localStorage.getItem("selectedProjectId") || null
  );

  const setSelectedProjectId = useCallback((id) => {
    if (id) {
      localStorage.setItem("selectedProjectId", id);
    } else {
      localStorage.removeItem("selectedProjectId");
    }
    setSelectedProjectIdState(id);
  }, []);

  return (
    <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
