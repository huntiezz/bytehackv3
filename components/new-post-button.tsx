"use client";

import { uploadFile } from "@/lib/upload-file";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  Upload, X, FileIcon, AlertCircle,
  Bold, Italic, Heading, Link as LinkIcon, Quote, List, Image as ImageIcon, Paperclip
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const CATEGORIES = [
  {
    label: "Forum categories",
    items: ["General Discussion", "Coding Discussion", "Cheat Discussion"]
  },
  {
    label: "Anti-cheat forums",
    items: ["VAC", "BattlEye", "Easy Anti-Cheat", "Vanguard", "Ricochet"]
  },
  {
    label: "Game Hacking",
    items: ["CS2", "Fortnite", "FiveM", "Rust", "Minecraft", "Game Reversal", "SDK", "Offsets"]
  },
  {
    label: "Other",
    items: ["Spoofer", "Custom"]
  }
];

export function NewPostButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General Discussion");
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/forum/categories")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllowedCategories(data);
          }
        })
        .catch(console.error);
    }
  }, [open]);

  const [uploadProgress, setUploadProgress] = useState<Array<{
    fileName: string;
    stage: 'uploading' | 'complete' | 'error';
    progress: number;
  }>>([]);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        setUploadStatus(`❌ blocked: ${file.name} - file too large (max 50MB)`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length !== selectedFiles.length) {
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  /* State for preview mode */
  const [isPreview, setIsPreview] = useState(false);

  /* ... upload handlers ... */

  const handleFormat = (type: string) => {
    const textarea = document.getElementById("post-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = content;
    let newCursorPos = end;

    switch (type) {
      case "bold":
        newText = content.substring(0, start) + `**${selectedText || "bold text"}**` + content.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 4 : 11);
        break;
      case "italic":
        newText = content.substring(0, start) + `*${selectedText || "italic text"}*` + content.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 2 : 13);
        break;
      case "link":
        const url = window.prompt("Enter link URL:", "https://");
        if (url) {
          newText = content.substring(0, start) + `[${selectedText || "Link text"}](${url})` + content.substring(end);
          newCursorPos = start + (selectedText ? selectedText.length + url.length + 4 : 12 + url.length);
        } else {
          return;
        }
        break;
      case "quote":
        newText = content.substring(0, start) + `\n> ${selectedText || "quote"}\n` + content.substring(end);
        newCursorPos = end + 4;
        break;
      case "list":
        newText = content.substring(0, start) + `\n- ${selectedText || "item"}` + content.substring(end);
        newCursorPos = end + 3;
        break;
      case "image":
        const imgUrl = window.prompt("Enter image URL:", "https://");
        if (imgUrl) {
          newText = content.substring(0, start) + `![${selectedText || "alt text"}](${imgUrl})` + content.substring(end);
          newCursorPos = start + (selectedText ? selectedText.length + imgUrl.length + 4 : 12 + imgUrl.length);
        } else {
          return;
        }
        break;
    }

    setContent(newText);
    if (!isPreview) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const renderPreview = (text: string) => {
    // Basic escaping of core HTML characters first
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Helper to validate URLs to prevent javascript: or otras schemes
    const safeUrl = (url: string) => {
      const trimmed = url.trim();
      if (trimmed.toLowerCase().startsWith('javascript:') ||
        trimmed.toLowerCase().startsWith('data:') ||
        trimmed.toLowerCase().startsWith('vbscript:')) {
        return '#';
      }
      return trimmed;
    };

    let html = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, url) =>
        `<img src="${safeUrl(url)}" alt="${alt}" class="max-w-full rounded-md mt-2 border border-zinc-800" />`
      )
      .replace(/\[(.*?)\]\((.*?)\)/g, (_, label, url) =>
        `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${label}</a>`
      )
      .replace(/^\s*-\s+(.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^>\s+(.*)/gm, '<blockquote class="border-l-2 border-zinc-500 pl-4 italic my-2 text-zinc-400">$1</blockquote>')
      .replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="text-zinc-300 text-sm leading-relaxed space-y-2" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalCategory = category === "Custom" ? customCategory : category;

      if (category === "Custom" && !customCategory.trim()) {
        toast.error("Please enter a custom category");
        setLoading(false);
        return;
      }

      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category: finalCategory,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!postRes.ok) {
        const data = await postRes.json();
        toast.error(data.error || "Failed to create post");
        return;
      }

      const postData = await postRes.json();

      if (files.length > 0) {
        setShowProgressModal(true);
        setOpen(false);

        setUploadProgress(files.map(file => ({
          fileName: file.name,
          stage: 'uploading' as const,
          progress: 0,
        })));

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = { ...newProgress[i], stage: 'uploading', progress: 10 };
              return newProgress;
            });
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = { ...newProgress[i], stage: 'uploading', progress: 30 };
              return newProgress;
            });

            const { publicUrl, path: storagePath } = await uploadFile(file);

            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = { ...newProgress[i], stage: 'uploading', progress: 70 };
              return newProgress;
            });
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postId: postData.id,
                fileName: file.name,
                fileSize: file.size,
                contentType: file.type,
                publicUrl: publicUrl,
                sha256: sha256,
                storage_path: storagePath
              }),
            });

            if (!uploadRes.ok) {
              throw new Error("Failed to register attachment");
            }

            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = { ...newProgress[i], stage: 'complete', progress: 100 };
              return newProgress;
            });

          } catch (error) {
            console.error("Upload error:", error);
            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = { ...newProgress[i], stage: 'error', progress: 100 };
              return newProgress;
            });
          }
        }

        setTimeout(() => {
          setShowProgressModal(false);
          setUploadProgress([]);
          router.refresh();
        }, 2000);
      } else {
        setOpen(false);
        router.refresh();
      }

      setTitle("");
      setContent("");
      setCategory("General Discussion");
      setCustomCategory("");
      setTags("");
      setFiles([]);
      setUploadStatus("");

    } catch (error) {
      toast.error("Network error. Please try again.");
      setShowProgressModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-white text-black hover:bg-white/90 font-semibold px-6 rounded-full">
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] flex flex-col bg-[#09090b] border-zinc-800 p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="px-8 py-6 border-b border-white/5 bg-[#09090b] flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-white tracking-tight">Create New Thread</DialogTitle>
          <p className="text-zinc-500 text-sm">Share your thoughts with the community</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#09090b]">

            {/* Thread Title */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Thread Title <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-zinc-600 font-mono">{title.length}/200</span>
              </div>
              <Input
                placeholder="Enter a descriptive title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className="bg-[#0c0c0e] border-white/10 h-12 text-sm text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700 placeholder:text-zinc-700"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category <span className="text-red-500">*</span></label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[400px] bg-[#0c0c0e] border-white/10 h-12 text-sm text-zinc-200 focus:ring-1 focus:ring-zinc-700">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0c0c0e] border-zinc-800 text-zinc-300">
                  {CATEGORIES.map((group) => {
                    const validItems = allowedCategories.length > 0
                      ? group.items.filter(item => allowedCategories.includes(item))
                      : group.items;

                    if (validItems.length === 0) return null;

                    return (
                      <SelectGroup key={group.label}>
                        <SelectLabel className="text-zinc-600 pl-2 pt-2 pb-1 uppercase text-[10px] font-bold tracking-widest">{group.label}</SelectLabel>
                        {validItems.map((item) => (
                          <SelectItem key={item} value={item} className="focus:bg-zinc-800 focus:text-white cursor-pointer pl-4 text-sm py-2">{item}</SelectItem>
                        ))}
                        <Separator className="my-1 bg-white/5" />
                      </SelectGroup>
                    );
                  })}

                  {/* Dynamic/Restricted Categories */}
                  {allowedCategories.filter(c => !CATEGORIES.some(g => g.items.includes(c))).length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-red-400 pl-2 pt-2 pb-1 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Restricted Access
                      </SelectLabel>
                      {allowedCategories.filter(c => !CATEGORIES.some(g => g.items.includes(c))).map((item) => (
                        <SelectItem key={item} value={item} className="focus:bg-zinc-800 focus:text-white cursor-pointer pl-4 text-sm py-2 text-red-200">{item}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>

              {category === "Custom" && (
                <Input
                  placeholder="Enter custom category..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                  className="mt-2 bg-[#0c0c0e] border-white/10 h-11 text-sm"
                />
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Content <span className="text-red-500">*</span></label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreview(!isPreview)}
                  className="h-6 text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-white"
                >
                  {isPreview ? <span className="flex items-center gap-1"><Bold className="h-3 w-3" /> Edit</span> : <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Preview</span>}
                </Button>
              </div>

              <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0c0c0e] focus-within:ring-1 focus-within:ring-zinc-700 transition-all min-h-[250px]">
                {!isPreview ? (
                  <>
                    {/* Toolbar */}
                    <div className="flex items-center gap-0.5 p-1.5 border-b border-white/5 bg-[#0e0e11]">
                      <Button type="button" onClick={() => handleFormat('bold')} variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"><Bold className="h-3.5 w-3.5" /></Button>
                      <Button type="button" onClick={() => handleFormat('italic')} variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"><Italic className="h-3.5 w-3.5" /></Button>
                      <div className="w-px h-3 bg-white/5 mx-1" />
                      <Button type="button" onClick={() => handleFormat('link')} variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"><LinkIcon className="h-3.5 w-3.5" /></Button>
                      <Button type="button" onClick={() => handleFormat('quote')} variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"><Quote className="h-3.5 w-3.5" /></Button>
                      <Button type="button" onClick={() => handleFormat('list')} variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"><List className="h-3.5 w-3.5" /></Button>
                      <div className="w-px h-3 bg-white/5 mx-1" />
                      <Button type="button" onClick={() => handleFormat('image')} variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"><ImageIcon className="h-3.5 w-3.5" /></Button>
                      <label htmlFor="file-upload-toolbar" className="cursor-pointer">
                        <div className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                          <Paperclip className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="file"
                          id="file-upload-toolbar"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,video/*,application/pdf,text/*,.zip,.rar,.exe,.dll,.sys,.bat,.cmd,.ps1,.sh"
                        />
                      </label>
                    </div>

                    <Textarea
                      id="post-content"
                      placeholder="Write your thread content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={8}
                      className="bg-transparent border-0 focus-visible:ring-0 resize-y min-h-[200px] p-4 text-sm text-zinc-300 placeholder:text-zinc-700"
                    />
                  </>
                ) : (
                  <div className="p-6 bg-[#0c0c0e] min-h-[250px]">
                    {content ? renderPreview(content) : <p className="text-zinc-600 italic text-sm">Nothing to preview...</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Preview */}
            {files.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-200">Attachments</label>
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-md">
                      <FileIcon className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-300 max-w-[150px] truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-500 hover:text-red-400"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tags <span className="text-zinc-600 font-normal normal-case tracking-normal">(Optional)</span></label>
              <Input
                placeholder="e.g., tutorial, help, discussion"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-[#0c0c0e] border-white/10 h-11 py-6 text-sm text-zinc-300 placeholder:text-zinc-700 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 mt-8">
              <DialogClose asChild>
                <Button variant="ghost" type="button" className="text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm h-10 px-6">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-zinc-200 font-bold px-8 h-10 shadow-lg shadow-white/5 text-sm">
                {loading ? "Creating..." : "Create Thread"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent >
      <UploadProgressModal open={showProgressModal} files={uploadProgress} />
    </Dialog >
  );
}
