'use client';

import { useState } from 'react';
import { Plus, Calendar, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { DailyGameType } from '@/lib/utils/daily-game-logic';

interface DailyGame {
    id: string;
    date: string;
    gameType: DailyGameType;
    targetValue: string;
    clues: unknown | null;
    _count?: { attempts: number };
}

interface DailyGamesAdminClientProps {
    initialGames: DailyGame[];
}

const gameTypeLabels: Record<DailyGameType, string> = {
    WORD: 'Word Puzzle',
    ATHLETE: 'Mystery Athlete',
    TEAM: 'Mystery Team',
    STAT: 'Stat Challenge',
};

const gameTypeBadgeVariants: Record<DailyGameType, string> = {
    WORD: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    ATHLETE: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    TEAM: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    STAT: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export function DailyGamesAdminClient({ initialGames }: DailyGamesAdminClientProps) {
    const [games, setGames] = useState<DailyGame[]>(initialGames);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<DailyGame | null>(null);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        date: '',
        gameType: 'WORD' as DailyGameType,
        targetValue: '',
        clues: '',
    });

    const resetForm = () => {
        setFormData({
            date: '',
            gameType: 'WORD',
            targetValue: '',
            clues: '',
        });
        setEditingGame(null);
    };

    const handleOpenDialog = (game?: DailyGame) => {
        if (game) {
            setEditingGame(game);
            setFormData({
                date: game.date,
                gameType: game.gameType,
                targetValue: game.targetValue,
                clues: game.clues ? JSON.stringify(game.clues, null, 2) : '',
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.date || !formData.targetValue) {
            toast({
                title: 'Validation Error',
                description: 'Date and target value are required',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            let clues = null;
            if (formData.clues.trim()) {
                try {
                    clues = JSON.parse(formData.clues);
                } catch {
                    toast({
                        title: 'Invalid JSON',
                        description: 'Clues must be valid JSON',
                        variant: 'destructive',
                    });
                    return;
                }
            }

            const response = await fetch('/api/admin/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: formData.date,
                    gameType: formData.gameType,
                    targetValue: formData.targetValue,
                    clues,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save game');
            }

            const { game } = await response.json();

            setGames(prev => {
                const existing = prev.findIndex(g => g.date === game.date);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = game;
                    return updated;
                }
                return [...prev, game].sort((a, b) => a.date.localeCompare(b.date));
            });

            toast({
                title: 'Success',
                description: editingGame ? 'Game updated' : 'Game created',
            });

            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to save game',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (game: DailyGame) => {
        if (!confirm(`Delete game for ${game.date}?`)) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/admin/daily?id=${game.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete game');
            }

            setGames(prev => prev.filter(g => g.id !== game.id));

            toast({
                title: 'Deleted',
                description: `Game for ${game.date} has been deleted`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete game',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoSchedule = async () => {
        if (!confirm('This will auto-schedule games for the next 30 days. Continue?')) return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/cron/daily-games', {
                method: 'POST',
                headers: { 'x-cron-secret': 'manual-trigger' },
            });

            if (!response.ok) {
                throw new Error('Failed to auto-schedule');
            }

            // Refresh games list
            const gamesResponse = await fetch('/api/admin/daily');
            const { games: newGames } = await gamesResponse.json();
            setGames(newGames);

            toast({
                title: 'Success',
                description: 'Games have been auto-scheduled',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to auto-schedule games',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-3">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Game
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
                            <DialogDescription>
                                {editingGame ? 'Update the daily game details' : 'Schedule a new daily game'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    disabled={!!editingGame}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gameType">Game Type</Label>
                                <Select
                                    value={formData.gameType}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, gameType: value as DailyGameType }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WORD">Word Puzzle</SelectItem>
                                        <SelectItem value="ATHLETE">Mystery Athlete</SelectItem>
                                        <SelectItem value="TEAM">Mystery Team</SelectItem>
                                        <SelectItem value="STAT">Stat Challenge</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="targetValue">Target Value / Answer</Label>
                                <Input
                                    id="targetValue"
                                    value={formData.targetValue}
                                    onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                                    placeholder={formData.gameType === 'WORD' ? 'SCORE' : 'Answer...'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="clues">Clues (JSON)</Label>
                                <Textarea
                                    id="clues"
                                    value={formData.clues}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clues: e.target.value }))}
                                    placeholder='{"hint": "...", "player": "..."}'
                                    rows={4}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? 'Saving...' : editingGame ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={handleAutoSchedule} disabled={isLoading}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                    Auto-Schedule 30 Days
                </Button>
            </div>

            {/* Games Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Answer</TableHead>
                            <TableHead>Attempts</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {games.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No games scheduled. Click &quot;Add Game&quot; or &quot;Auto-Schedule&quot; to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            games.map((game) => (
                                <TableRow key={game.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            {game.date}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={gameTypeBadgeVariants[game.gameType]}>
                                            {gameTypeLabels[game.gameType]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {game.targetValue.length > 20
                                            ? game.targetValue.substring(0, 20) + '...'
                                            : game.targetValue}
                                    </TableCell>
                                    <TableCell>{game._count?.attempts ?? 0}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(game)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(game)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
