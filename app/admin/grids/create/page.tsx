"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { GridBuilder, GridBuilderData } from "@/components/admin/GridBuilder";
import { generateSlug } from "@/lib/slug-utils";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    sport: z.string().optional(),
});

export default function CreateGridPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [gridData, setGridData] = useState<GridBuilderData>({
        rows: ["", "", ""],
        cols: ["", "", ""],
        cellAnswers: [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
        ],
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            slug: "",
            description: "",
            sport: "",
        },
    });

    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("title", e.target.value);
        if (!form.getValues("slug")) {
            form.setValue("slug", generateSlug(e.target.value));
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                ...values,
                size: 3,
                rows: gridData.rows,
                cols: gridData.cols,
                cellAnswers: gridData.cellAnswers,
            };

            const response = await fetch("/api/grids", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create grid");
            }

            toast({
                title: "Grid created!",
                description: "The immaculate grid has been created successfully.",
            });

            router.push("/admin/grids");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/grids">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <h1 className="text-lg font-semibold">Create Immaculate Grid</h1>
                    </div>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={form.formState.isSubmitting}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {form.formState.isSubmitting ? "Creating..." : "Create Grid"}
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                <Form {...form}>
                    <form className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        onTitleChange(e);
                                                    }}
                                                    placeholder="e.g. NBA 2024 Grid"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="auto-generated" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sport</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Basketball" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Short description..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold tracking-tight">Grid Configuration</h2>
                            <GridBuilder
                                onChange={setGridData}
                            />
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
