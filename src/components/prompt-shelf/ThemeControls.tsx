import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggleCompact() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={resolvedTheme === "dark"}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="toggle-thumb">
        {resolvedTheme === "dark" ? (
          <Moon className="size-3 text-primary" />
        ) : (
          <Sun className="size-3 text-primary" />
        )}
      </span>
    </button>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const options: {
    value: "light" | "dark" | "system";
    label: string;
    icon: typeof Sun;
  }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="flex gap-1.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          className={`btn-ghost flex-1 justify-center gap-1.5 rounded-lg py-2 ${theme === value ? "bg-accent font-semibold text-accent-foreground" : ""}`}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}
