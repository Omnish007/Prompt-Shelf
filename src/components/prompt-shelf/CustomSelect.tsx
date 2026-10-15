import { Folder } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption<T extends string> = {
  value: T;
  label: string;
  icon?: typeof Folder;
  description?: string;
};

interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  icon?: typeof Folder;
  disabled?: boolean;
  align?: "left" | "right";
}

/** Shared styled select built on shadcn/Radix so focus, Escape, and arrow-key behavior stay accessible. */
export function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  icon: Icon,
  disabled = false,
  align = "left",
}: CustomSelectProps<T>) {
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as T)}
    >
      <SelectTrigger
        className={cn("field h-8 min-w-0 px-2.5 py-1 text-xs", className)}
      >
        <span className="!flex min-w-0 items-center gap-1.5 truncate">
          {Icon && (
            <Icon
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {SelectedIcon && (
            <SelectedIcon
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <SelectValue placeholder={placeholder ?? "Choose an option"}>
            {selected?.label ?? value}
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent align={align === "right" ? "end" : "start"}>
        {options.map((option) => {
          const OptionIcon = option.icon;
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs"
            >
              <span className="flex items-start gap-2">
                {OptionIcon && (
                  <OptionIcon
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span className="grid gap-0.5">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[11px] text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
