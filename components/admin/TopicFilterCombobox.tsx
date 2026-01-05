"use client";

import { useState, useEffect } from "react";
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

interface TopicFilterComboboxProps {
    topics: Topic[];
    defaultValue?: string;
    name?: string;
    placeholder?: string;
    emptyLabel?: string;
    className?: string;
}

export function TopicFilterCombobox({
    topics,
    defaultValue = "",
    name = "topicId",
    placeholder = "Search topics...",
    emptyLabel = "All topics",
    className,
}: TopicFilterComboboxProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue);

    // Sync with defaultValue if it changes (e.g., URL params)
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const selectedTopic = topics.find((t) => t.id === value);

    return (
        <>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={value} />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between", className)}
                    >
                        {value && selectedTopic
                            ? selectedTopic.name
                            : emptyLabel}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder={placeholder} />
                        <CommandList>
                            <CommandEmpty>No topic found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value=""
                                    onSelect={() => {
                                        setValue("");
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {emptyLabel}
                                </CommandItem>
                                {topics.map((topic) => (
                                    <CommandItem
                                        key={topic.id}
                                        value={topic.name}
                                        onSelect={() => {
                                            setValue(topic.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === topic.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {"— ".repeat(topic.level ?? 0)}{topic.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}
