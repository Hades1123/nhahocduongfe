import { QueryClient, QueryClientProvider } from "react-query";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { AppRoutes } from "./routes/AppRoutes";
import { useTheme } from "./hooks/useTheme";
import useAuthStore from "@/stores/authStore";

/**
 * App — Root component.
 *
 * useTheme() is mounted here (once) to:
 *  - Restore the saved color palette + mode from localStorage on load
 *  - React to future store changes and re-apply CSS custom properties
 */
function App() {
  const queryClient = new QueryClient();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Apply the stored theme immediately — this sets CSS vars on <html>
  // and adds/removes class="dark" for Tailwind dark mode.
  useTheme();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </BrowserRouter>
    </>
  );
}

export default App;

