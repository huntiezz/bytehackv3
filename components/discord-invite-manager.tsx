"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DiscordInviteManagerProps {
  users: any[];
}

export function DiscordInviteManager({ users }: DiscordInviteManagerProps) {
  const [guildId, setGuildId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const handleSelectAll = () => {
    const usersWithDiscord = users.filter(u => u.discord_id);
    setSelectedUsers(usersWithDiscord.map(u => u.id));
  };

  const handleInvite = async () => {
    if (!guildId || selectedUsers.length === 0) {
      alert("Please enter Guild ID and select users");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/admin/discord/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          userIds: selectedUsers,
        }),
      });

      const data = await res.json();
      setResults(data.results || []);
      
      if (res.ok) {
        const successCount = data.results.filter((r: any) => r.success).length;
        alert(`Successfully invited ${successCount}/${selectedUsers.length} users`);
        router.refresh();
      } else {
        alert("Failed to send invites: " + data.error);
      }
    } catch (error) {
      alert("Error sending invites");
    } finally {
      setLoading(false);
    }
  };

  const usersWithDiscord = users.filter(u => u.discord_id);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Discord Server Invite Manager</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Discord Server ID</label>
          <Input
            placeholder="Enter your Discord server/guild ID"
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Right-click your server → Copy Server ID (Developer Mode must be enabled)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Select Users ({selectedUsers.length} selected)</label>
            <Button size="sm" variant="outline" onClick={handleSelectAll}>
              Select All with Discord
            </Button>
          </div>
          
          <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
            {usersWithDiscord.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users with Discord accounts found
              </p>
            ) : (
              usersWithDiscord.map((user) => (
                <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{user.name}</span>
                  <span className="text-xs text-muted-foreground">({user.discord_username})</span>
                </label>
              ))
            )}
          </div>
        </div>

        <Button
          onClick={handleInvite}
          disabled={loading || !guildId || selectedUsers.length === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Invites...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''} to Server
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="mt-4 p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">Results:</div>
            <div className="space-y-1 text-xs">
              {results.map((result, i) => (
                <div key={i} className={result.success ? "text-green-600" : "text-red-600"}>
                  {result.success ? "✓" : "✗"} User {i + 1}: {result.success ? "Invited" : result.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
