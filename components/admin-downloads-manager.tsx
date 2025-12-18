"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, FileText, Download, User } from "lucide-react";
import { updateUploadStatus } from "@/app/actions/admin";
import toast from "react-hot-toast";

interface Upload {
    id: string;
    file_name: string;
    file_size: number;
    content_type: string;
    public_url: string;
    description: string;
    sha256: string;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    uploader_id: string;
    uploader?: {
        username: string;
        display_name: string;
    };
}

export function AdminDownloadsManager({ uploads }: { uploads: Upload[] }) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, status: 'approved' | 'denied') => {
        setIsLoading(id);
        try {
            const result = await updateUploadStatus(id, status);
            if (result.success) {
                toast.success(`Upload ${status} successfully`);
            } else {
                toast.error(result.error || "Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="flex items-center text-green-500 gap-1 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                    </div>
                );
            case 'denied':
                return (
                    <div className="flex items-center text-red-500 gap-1 text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-4 h-4" />
                        Denied
                    </div>
                );
            default:
                return (
                    <div className="flex items-center text-yellow-500 gap-1 text-xs font-bold uppercase tracking-wider">
                        <FileText className="w-4 h-4" />
                        Pending
                    </div>
                );
        }
    };

    const UploadCard = ({ upload }: { upload: Upload }) => (
        <Card className="p-6 bg-[#050505] border-white/5 mb-4 group hover:border-white/10 transition-colors">
            <div className="flex flex-col md:flex-row gap-6 justify-between">
                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-white">{upload.file_name}</h3>
                            <StatusBadge status={upload.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/40">
                            <span>Uploaded by <span className="text-white hover:underline cursor-pointer">{upload.uploader?.display_name || upload.uploader?.username || 'Unknown'}</span></span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(upload.created_at))} ago</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">

                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">File Size</div>
                            <div className="text-white font-mono">{formatFileSize(upload.file_size)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">File Type</div>
                            <div className="text-white truncate" title={upload.content_type || 'Unknown'}>
                                {upload.content_type ? (upload.content_type.split('/')[1] || upload.content_type) : 'Unknown'}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">SHA256</div>
                            <div className="text-white/60 font-mono text-[10px] truncate max-w-[200px]" title={upload.sha256}>
                                {upload.sha256 || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Description</div>
                        <p className="text-white/60 text-sm">
                            {upload.description || "None provided"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 justify-center min-w-[140px]">
                    <a href={upload.public_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </a>

                    {upload.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={() => handleStatusUpdate(upload.id, 'approved')}
                                disabled={isLoading === upload.id}
                                className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                            >
                                Approve
                            </Button>
                            <Button
                                onClick={() => handleStatusUpdate(upload.id, 'denied')}
                                disabled={isLoading === upload.id}
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            >
                                Deny
                            </Button>
                        </div>
                    )}

                    {upload.status !== 'pending' && (
                        <Button
                            variant="ghost"
                            onClick={() => handleStatusUpdate(upload.id, upload.status === 'approved' ? 'denied' : 'approved')}
                            disabled={isLoading === upload.id}
                            className="text-white/40 hover:text-white text-xs"
                        >
                            Change Status
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );

    const pendingUploads = uploads.filter(u => u.status === 'pending');
    const approvedUploads = uploads.filter(u => u.status === 'approved');
    const deniedUploads = uploads.filter(u => u.status === 'denied');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Downloads</h2>
                <p className="text-white/40">Review and moderate file uploads before they become available to the community.</p>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="bg-transparent border-b border-white/5 p-0 h-auto w-full justify-start rounded-none gap-6">
                    <TabsTrigger
                        value="all"
                        className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-3 font-medium uppercase tracking-wider text-xs hover:text-white/60 transition-colors"
                    >
                        All
                    </TabsTrigger>
                    <TabsTrigger
                        value="pending"
                        className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-3 font-medium uppercase tracking-wider text-xs hover:text-white/60 transition-colors"
                    >
                        Pending ({pendingUploads.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="approved"
                        className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-3 font-medium uppercase tracking-wider text-xs hover:text-white/60 transition-colors"
                    >
                        Approved ({approvedUploads.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="denied"
                        className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-3 font-medium uppercase tracking-wider text-xs hover:text-white/60 transition-colors"
                    >
                        Denied ({deniedUploads.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="animate-in fade-in-50 duration-500">
                    {uploads.length === 0 ? (
                        <div className="text-center py-12 text-white/20">No uploads found</div>
                    ) : (
                        uploads.map(upload => <UploadCard key={upload.id} upload={upload} />)
                    )}
                </TabsContent>

                <TabsContent value="pending" className="animate-in fade-in-50 duration-500">
                    {pendingUploads.length === 0 ? (
                        <div className="text-center py-12 text-white/20">No pending uploads</div>
                    ) : (
                        pendingUploads.map(upload => <UploadCard key={upload.id} upload={upload} />)
                    )}
                </TabsContent>

                <TabsContent value="approved" className="animate-in fade-in-50 duration-500">
                    {approvedUploads.length === 0 ? (
                        <div className="text-center py-12 text-white/20">No approved uploads</div>
                    ) : (
                        approvedUploads.map(upload => <UploadCard key={upload.id} upload={upload} />)
                    )}
                </TabsContent>

                <TabsContent value="denied" className="animate-in fade-in-50 duration-500">
                    {deniedUploads.length === 0 ? (
                        <div className="text-center py-12 text-white/20">No denied uploads</div>
                    ) : (
                        deniedUploads.map(upload => <UploadCard key={upload.id} upload={upload} />)
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
