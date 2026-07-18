import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Link as LinkIcon, Plus } from "lucide-react";

export function MultiplayerModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [joinCode, setJoinCode] = React.useState("");

  const handleCreate = () => {
    // Generate a random 4 letter code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    router.push(`?room=${code}`);
    onOpenChange(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length > 0) {
      router.push(`?room=${joinCode.trim().toUpperCase()}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-emerald-500" />
            Multiplayer Session
          </DialogTitle>
          <DialogDescription>
            Create a new room to invite friends, or join an existing one using a code.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="join" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Room</TabsTrigger>
            <TabsTrigger value="create">Create Room</TabsTrigger>
          </TabsList>
          
          <TabsContent value="join" className="pt-4">
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Room Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. A7X9"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="uppercase text-lg font-mono tracking-widest"
                  maxLength={10}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={joinCode.trim().length === 0} className="w-full">
                <LinkIcon className="mr-2 size-4" />
                Join Session
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="create" className="pt-4 flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              Creating a room will generate a unique 4-character code you can share with others to sync your discussion.
            </div>
            <Button onClick={handleCreate} className="w-full">
              <Plus className="mr-2 size-4" />
              Generate New Room
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
