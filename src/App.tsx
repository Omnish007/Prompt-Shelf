import { ThemeProvider } from "@/hooks/use-theme";
import PromptShelf from "@/components/PromptShelf";

export default function App() {
  return (
    <ThemeProvider>
      <PromptShelf />
    </ThemeProvider>
  );
}
