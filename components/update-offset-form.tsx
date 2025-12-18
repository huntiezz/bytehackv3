"use client";

import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-file";
import { Info } from "lucide-react";

interface UpdateOffsetFormProps {
  gameName?: string;
}

export function UpdateOffsetForm({ gameName }: UpdateOffsetFormProps) {
  const [gameNameInput, setGameNameInput] = useState(gameName || "");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [offsetData, setOffsetData] = useState("");
  const [structures, setStructures] = useState("");
  const [notes, setNotes] = useState("");
  const [gameImage, setGameImage] = useState<File | null>(null);
  const [sdkDump, setSdkDump] = useState<File | null>(null);
  const [memDump, setMemDump] = useState<File | null>(null);
  const [dumpImages, setDumpImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousData, setPreviousData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (gameName) {
      const fetchPreviousVersion = async () => {
        try {
          const res = await fetch(`/api/offsets/latest?game=${encodeURIComponent(gameName)}`);
          if (res.ok) {
            const data = await res.json();
            setPreviousData(data);
            if (data.description) setDescription(data.description);
          }
        } catch (error) {
          console.error("Error fetching previous version:", error);
        }
      };
      fetchPreviousVersion();
    }
  }, [gameName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!offsetData) {
        toast.error("Please provide offset data");
        setLoading(false);
        return;
      }

      let parsedData = null;

      if (offsetData) {
        try {
          parsedData = JSON.parse(offsetData);
        } catch {
          try {
            const lines = offsetData.trim().split('\n');
            const simpleData: Record<string, string> = {};

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              const match = trimmedLine.match(/^([^:=]+)[:=]\s*(.+)$/);
              if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                simpleData[key] = value;
              } else {
                toast.error("Invalid offset format. Use 'key: value' or valid JSON");
                setLoading(false);
                return;
              }
            }

            if (Object.keys(simpleData).length === 0) {
              toast.error("No valid offsets found. Use 'key: value' format or JSON");
              setLoading(false);
              return;
            }

            parsedData = simpleData;
          } catch {
            toast.error("Invalid offset format. Use 'key: value' or valid JSON");
            setLoading(false);
            return;
          }
        }
      }

      let imageUrl = gameImage ? null : (previousData?.image_url || null);
      let sdkDumpUrl = sdkDump ? null : (previousData?.sdk_dump_url || null);
      let memDumpUrl = memDump ? null : (previousData?.mem_dump_url || null);
      let dumpImageUrls: string[] = dumpImages.length > 0 ? [] : (previousData?.dump_images || []);

      if (gameImage) {
        try {
          const { publicUrl } = await uploadFile(gameImage);
          imageUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload game image");
          setLoading(false);
          return;
        }
      }

      if (sdkDump) {
        try {
          const { publicUrl } = await uploadFile(sdkDump);
          sdkDumpUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload SDK dump");
          setLoading(false);
          return;
        }
      }

      if (memDump) {
        try {
          const { publicUrl } = await uploadFile(memDump);
          memDumpUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload memory dump");
          setLoading(false);
          return;
        }
      }

      if (dumpImages.length > 0) {
        try {
          toast.loading("Uploading dump images...", { id: "dump-images" });
          dumpImageUrls = [];
          for (const image of dumpImages) {
            const { publicUrl } = await uploadFile(image);
            dumpImageUrls.push(publicUrl);
          }
          toast.success("Dump images uploaded!", { id: "dump-images" });
        } catch (error) {
          toast.error("Failed to upload dump images", { id: "dump-images" });
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/offsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_name: gameNameInput,
          version,
          description: description.trim() || previousData?.description || null,
          offset_data: parsedData,
          structures: structures.trim() || previousData?.structures || null,
          notes: notes.trim() || previousData?.notes || null,
          image_url: imageUrl,
          sdk_dump_url: sdkDumpUrl,
          mem_dump_url: memDumpUrl,
          dump_images: dumpImageUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(gameName ? "New version published!" : "Offset published successfully!");
        router.push(`/offsets/${data.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post offset");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      {gameName && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Updating {gameName}</p>
            <p className="text-muted-foreground">
              You're adding a new version to an existing game. The game name is locked.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Game Name</label>
          <Input
            placeholder="e.g., Apex Legends"
            value={gameNameInput}
            onChange={(e) => setGameNameInput(e.target.value)}
            required
            disabled={!!gameName}
            className={gameName ? "opacity-60" : ""}
          />
          {gameName && (
            <p className="text-xs text-muted-foreground mt-1">
              Game name cannot be changed when updating
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Version</label>
          <Input
            placeholder="e.g., v3.0.81.37 or 67"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use a unique version number for this update
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
          <Textarea
            placeholder="Brief description of this offset update..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          {gameName && !description && previousData?.description && (
            <p className="text-xs text-primary mt-1">
              ℹ️ Using previous description (leave blank to keep)
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Game Image (Optional)</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setGameImage(e.target.files?.[0] || null)}
          />
          {gameName && previousData?.image_url ? (
            <p className="text-xs text-primary mt-1">
              ℹ️ Previous image will be used if not uploaded
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Upload a cover image for the game
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Offset Data</label>
          <Textarea
            placeholder={`Simple format:\nLocalPlayer: 0x1234560\nEntityList: 0x1D8F3C0\nViewMatrix: 0x1E3BD40\n\nOr JSON:\n{"LocalPlayer": "0x1234560", "EntityList": "0x1D8F3C0"}`}
            value={offsetData}
            onChange={(e) => setOffsetData(e.target.value)}
            rows={8}
            className="font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste offsets in simple format (key: value) or JSON
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Structures & Functions (Optional)</label>
          <Textarea
            placeholder={`// --- FName ID structure ---\n// [ 16 bits block index | 16 bits name index ]\n// HIWORD(a1): block number\n// LOWORD(a1): index within that block\n\nstruct FName {\n    uint32_t Index;\n    uint32_t Number;\n};`}
            value={structures}
            onChange={(e) => setStructures(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Add code structures, function explanations, or technical documentation (C++/C syntax)
          </p>
          {gameName && !structures && previousData?.structures && (
            <p className="text-xs text-primary mt-1">
              Using previous structures (leave blank to keep)
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">SDK Dump (Optional)</label>
          <Input
            type="file"
            accept=".zip,.rar,.7z,.tar,.gz"
            onChange={(e) => setSdkDump(e.target.files?.[0] || null)}
          />
          {gameName && previousData?.sdk_dump_url ? (
            <p className="text-xs text-primary mt-1">
              ℹ️ Previous SDK dump will be used if not uploaded
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Upload SDK dump archive (.zip, .rar, .7z, etc.)
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Memory Dump (Optional)</label>
          <Input
            type="file"
            accept=".exe,.dll,.dmp,.bin"
            onChange={(e) => setMemDump(e.target.files?.[0] || null)}
          />
          {gameName && previousData?.mem_dump_url ? (
            <p className="text-xs text-primary mt-1">
              ℹ️ Previous memory dump will be used if not uploaded
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Upload memory dump (.exe, .dll, .dmp, .bin, etc.)
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Dump Screenshots (Optional)</label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                setDumpImages(Array.from(files));
              }
            }}
          />
          {dumpImages.length > 0 ? (
            <p className="text-xs text-primary mt-1">
              {dumpImages.length} image(s) selected
            </p>
          ) : gameName && previousData?.dump_images?.length > 0 ? (
            <p className="text-xs text-primary mt-1">
              ℹ️ Previous dump screenshots will be used if not uploaded
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Upload screenshots of your dump process (IDA, Ghidra, etc.) - Multiple images supported
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
          <Textarea
            placeholder="Additional information about this update..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          {gameName && !notes && previousData?.notes && (
            <p className="text-xs text-primary mt-1">
              ℹ️ Using previous notes (leave blank to keep)
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Publishing..." : gameName ? "Publish New Version" : "Publish Offset"}
        </Button>
      </form>
    </Card>
  );
}
