"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Topic {
    id: string;
    name: string;
    level?: number;
}

interface TopicSelectorProps {
    topics: Topic[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
    valueKey?: "id" | "name";
    showNone?: boolean;
    noneLabel?: string;
}

export function TopicSelector({
    topics,
    value,
    onChange,
    placeholder = "Select topic...",
    searchPlaceholder = "Search topics...",
    disabled = false,
    className,
    valueKey = "id",
    showNone = false,
    noneLabel = "None (root topic)",
}: TopicSelectorProps) {
    const [open, setOpen] = useState(false);

    // Find selected topic based on the valueKey
    const selectedTopic = topics.find((t) =>
        valueKey === "id" ? t.id === value : t.name === value
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    {value && selectedTopic
                        ? selectedTopic.name
                        : showNone ? noneLabel : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>No topic found.</CommandEmpty>
                        <CommandGroup>
                            {showNone && (
                                <CommandItem
                                    value="none"
                                    onSelect={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {noneLabel}
                                </CommandItem>
                            )}
                            {topics.map((topic) => (
                                <CommandItem
                                    key={topic.id}
                                    value={topic.name}
                                    onSelect={() => {
                                        const valToEmit = valueKey === "id" ? topic.id : topic.name;
                                        onChange(valToEmit);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            (value === (valueKey === "id" ? topic.id : topic.name)) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {"  ".repeat(topic.level ?? 0)}{topic.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
