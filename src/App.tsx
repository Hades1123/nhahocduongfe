import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { AppRoutes } from "./routes/AppRoutes";
import { useTheme } from "./hooks/useTheme";

/**
 * App — Root component.
 *
 * useTheme() is mounted here (once) to:
 *  - Restore the saved color palette + mode from localStorage on load
 *  - React to future store changes and re-apply CSS custom properties
 */
function App() {
  const queryClient = new QueryClient();

  // Apply the stored theme immediately — this sets CSS vars on <html>
  // and adds/removes class="dark" for Tailwind dark mode.
  useTheme();

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

