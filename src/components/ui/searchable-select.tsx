import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Выберите...",
  searchPlaceholder = "Поиск...",
  emptyText = "Ничего не найдено",
  disabled = false,
  className,
}: SearchableSelectProps) => {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <Icon name="ChevronsUpDown" size={14} className="ml-2 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  onSelect={() => {
                    onValueChange(undefined);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <Icon name="X" size={14} className="mr-2" />
                  Очистить
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.icon && (
                    <span className="mr-2">{option.icon}</span>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-muted-foreground truncate">{option.sublabel}</span>
                    )}
                  </div>
                  {value === option.value && (
                    <Icon name="Check" size={14} className="ml-auto shrink-0 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;