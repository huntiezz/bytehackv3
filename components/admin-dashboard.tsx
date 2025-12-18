"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, ShoppingBag, Code2, Shield, Lock, Ticket, Download, Activity, Pin, Trash, Bell } from "lucide-react";
import { AdminDownloadsManager } from "@/components/admin-downloads-manager";
import { InviteCodesManager } from "@/components/invite-codes-manager";
import { AdminUserEditSheet } from "@/components/admin-user-edit-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminNotificationSender } from "@/components/admin-notification-sender";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdminDashboardProps {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    recentUsers: any[];
    recentPosts: any[];
    uploads: any[];
    currentUser: any;
}

export function AdminDashboard({
    totalUsers,
    totalPosts,
    totalComments,
    recentUsers,
    recentPosts,
    uploads,
    currentUser
}: AdminDashboardProps) {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const [deleteReason, setDeleteReason] = useState("");
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [userSearch, setUserSearch] = useState("");
    const [threadSearch, setThreadSearch] = useState("");
    const [usersPage, setUsersPage] = useState(1);
    const [threadsPage, setThreadsPage] = useState(1);
    const itemsPerPage = 20;

    const filteredUsers = recentUsers.filter(u =>
        u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.id?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredPosts = recentPosts.filter(post =>
        post.title?.toLowerCase().includes(threadSearch.toLowerCase()) ||
        post.category?.toLowerCase().includes(threadSearch.toLowerCase()) ||
        post.author?.username?.toLowerCase().includes(threadSearch.toLowerCase()) ||
        post.author?.display_name?.toLowerCase().includes(threadSearch.toLowerCase()) ||
        post.id?.toLowerCase().includes(threadSearch.toLowerCase())
    );

    const totalUsersPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const totalThreadsPages = Math.ceil(filteredPosts.length / itemsPerPage);

    const paginatedUsers = filteredUsers.slice(
        (usersPage - 1) * itemsPerPage,
        usersPage * itemsPerPage
    );

    const paginatedPosts = filteredPosts.slice(
        (threadsPage - 1) * itemsPerPage,
        threadsPage * itemsPerPage
    );

    const stats = [
        { label: "TOTAL USERS", value: totalUsers || 0, icon: Users },
        { label: "TOTAL FORUMS", value: totalPosts || 0, icon: MessageSquare },
        { label: "TOTAL MESSAGES", value: totalComments || 0, icon: Activity },
    ];

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setIsEditSheetOpen(true);
    };

    const handlePin = async (taskId: string, currentStatus: boolean) => {
        try {
            const { togglePostPin } = await import("@/app/actions/admin");
            const result = await togglePostPin(taskId, !currentStatus);
            if (result.success) {
                toast.success(currentStatus ? "Thread unpinned" : "Thread pinned");
            } else {
                toast.error(result.error || "Failed to update pin status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleLock = async (taskId: string, currentStatus: boolean) => {
        try {
            const { togglePostLock } = await import("@/app/actions/admin");
            const result = await togglePostLock(taskId, !currentStatus);
            if (result.success) {
                toast.success(currentStatus ? "Thread unlocked" : "Thread locked");
            } else {
                toast.error(result.error || "Failed to update lock status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleDeleteRequest = (postId: string) => {
        setPostToDelete(postId);
        setDeleteReason("");
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!postToDelete || !deleteReason.trim()) {
            toast.error("Please provide a reason for deletion");
            return;
        }

        try {
            const { deletePostAdmin } = await import("@/app/actions/admin");
            const result = await deletePostAdmin(postToDelete, deleteReason);
            if (result.success) {
                toast.success("Thread deleted and user notified");
                setIsDeleteModalOpen(false);
                setPostToDelete(null);
            } else {
                toast.error(result.error || "Failed to delete thread");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-sans">
            <div className="max-w-[1600px] mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="mb-8 px-6">
                            <div className="text-2xl font-bold tracking-tighter">BYTEHACK</div>
                            <div className="text-[10px] uppercase text-white/40 tracking-widest mt-1">Admin Panel</div>
                        </div>

                        <TabsList className="flex flex-col h-auto w-full bg-transparent gap-2 p-0">
                            <TabsTrigger
                                value="overview"
                                className="w-full justify-start px-6 py-4 text-sm font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-[#111] rounded-[16px] border border-transparent data-[state=active]:border-white/5 transition-all"
                            >
                                <Activity className="w-4 h-4 mr-3" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="users"
                                className="w-full justify-start px-6 py-4 text-sm font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-[#111] rounded-[16px] border border-transparent data-[state=active]:border-white/5 transition-all"
                            >
                                <Users className="w-4 h-4 mr-3" />
                                Users
                            </TabsTrigger>
                            <TabsTrigger
                                value="threads"
                                className="w-full justify-start px-6 py-4 text-sm font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-[#111] rounded-[16px] border border-transparent data-[state=active]:border-white/5 transition-all"
                            >
                                <MessageSquare className="w-4 h-4 mr-3" />
                                Threads
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="w-full justify-start px-6 py-4 text-sm font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-[#111] rounded-[16px] border border-transparent data-[state=active]:border-white/5 transition-all"
                            >
                                <Bell className="w-4 h-4 mr-3" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger
                                value="invites"
                                className="w-full justify-start px-6 py-4 text-sm font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-[#111] rounded-[16px] border border-transparent data-[state=active]:border-white/5 transition-all"
                            >
                                <Ticket className="w-4 h-4 mr-3" />
                                Invite Codes
                            </TabsTrigger>
                            <TabsTrigger
                                value="downloads"
                                className="w-full justify-start px-6 py-4 text-sm font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-[#111] rounded-[16px] border border-transparent data-[state=active]:border-white/5 transition-all"
                            >
                                <Download className="w-4 h-4 mr-3" />
                                Downloads
                            </TabsTrigger>
                        </TabsList>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-500">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                                <p className="text-white/40">Monitor community activity at a glance.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[24px]">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
                                        <div className="text-4xl font-bold text-white">{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[24px] flex flex-col justify-between min-h-[200px]">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">Manage users</h3>
                                        <p className="text-white/40 text-sm">Review new accounts, promote admins, or audit member activity.</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-fit border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-full px-6"
                                        onClick={() => setActiveTab("users")}
                                    >
                                        Go to Users
                                    </Button>
                                </div>
                                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[24px] flex flex-col justify-between min-h-[200px]">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">Moderate threads</h3>
                                        <p className="text-white/40 text-sm">Pin announcements, lock discussions, or remove problematic content.</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-fit border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-full px-6"
                                        onClick={() => setActiveTab("threads")}
                                    >
                                        Go to Threads
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-6 animate-in fade-in-50 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Users</h2>
                                <p className="text-white/40">Browse every account, adjust roles, and keep an eye on new sign-ups.</p>
                            </div>

                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-1">
                                <div className="flex items-center px-4 py-2">
                                    <Users className="w-5 h-5 text-white/30 mr-3" />
                                    <Input
                                        type="text"
                                        placeholder="Search by username or email"
                                        className="bg-transparent border-none outline-none text-white placeholder:text-white/30 w-full h-10 text-sm focus-visible:ring-0"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                    <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold text-xs px-4 rounded-full uppercase tracking-wider">Search</Button>
                                </div>
                            </div>

                            <div className="bg-[#050505] border border-white/5 rounded-[24px] p-6 text-sm text-white/30 font-bold uppercase tracking-widest flex items-center justify-between">
                                <span>Showing {((usersPage - 1) * itemsPerPage) + 1}-{Math.min(usersPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} Users</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs px-3 rounded-lg"
                                        onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                        disabled={usersPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-white/60 text-xs">Page {usersPage} of {totalUsersPages}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs px-3 rounded-lg"
                                        onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                                        disabled={usersPage === totalUsersPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5">
                                    <div className="col-span-4">User</div>
                                    <div className="col-span-3">User ID</div>
                                    <div className="col-span-2">Role</div>
                                    <div className="col-span-3 text-right">Actions</div>
                                </div>

                                {/* User Rows */}
                                {paginatedUsers.map((u: any) => (
                                    <div key={u.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#0A0A0A] border border-white/5 rounded-[16px] hover:border-white/10 transition-colors">
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#111] overflow-hidden flex-shrink-0">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.display_name || u.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/40">{(u.display_name || u.username)?.[0]?.toUpperCase() || 'U'}</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{u.display_name || u.username || 'Unknown'}</div>
                                                <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">
                                                    @{u.username || 'unknown'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-3 text-white/60 text-sm truncate pr-4 font-mono text-xs">
                                            {u.id.slice(0, 16)}...
                                        </div>

                                        <div className="col-span-2">
                                            <Badge variant="outline" className="bg-[#111] border-white/10 text-white/60 hover:text-white uppercase text-[10px] tracking-widest px-2 py-1 h-auto">
                                                {u.is_admin ? 'Admin' : (u.role || 'User')}
                                            </Badge>
                                        </div>

                                        <div className="col-span-3 flex justify-end gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 text-xs font-bold"
                                                onClick={() => handleEditUser(u)}
                                            >
                                                Manage
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Threads Tab */}
                        <TabsContent value="threads" className="space-y-6 animate-in fade-in-50 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Threads</h2>
                                <p className="text-white/40">Pin announcements, lock conversations, or remove content when needed.</p>
                            </div>

                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-1">
                                <div className="flex items-center px-4 py-2">
                                    <Input
                                        type="text"
                                        placeholder="Search by title, category, or author"
                                        className="bg-transparent border-none outline-none text-white placeholder:text-white/30 w-full h-10 text-sm focus-visible:ring-0"
                                        value={threadSearch}
                                        onChange={(e) => setThreadSearch(e.target.value)}
                                    />
                                    <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold text-xs px-4 rounded-full uppercase tracking-wider">Search</Button>
                                </div>
                            </div>

                            <div className="bg-[#050505] border border-white/5 rounded-[24px] p-6 text-sm text-white/30 font-bold uppercase tracking-widest flex items-center justify-between">
                                <span>Showing {((threadsPage - 1) * itemsPerPage) + 1}-{Math.min(threadsPage * itemsPerPage, filteredPosts.length)} of {filteredPosts.length} Threads</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs px-3 rounded-lg"
                                        onClick={() => setThreadsPage(p => Math.max(1, p - 1))}
                                        disabled={threadsPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-white/60 text-xs">Page {threadsPage} of {totalThreadsPages}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs px-3 rounded-lg"
                                        onClick={() => setThreadsPage(p => Math.min(totalThreadsPages, p + 1))}
                                        disabled={threadsPage === totalThreadsPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5">
                                    <div className="col-span-5">Thread</div>
                                    <div className="col-span-2">Category</div>
                                    <div className="col-span-2">Author</div>
                                    <div className="col-span-3 text-right">Actions</div>
                                </div>

                                {paginatedPosts.map((post: any) => (
                                    <div key={post.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#0A0A0A] border border-white/5 rounded-[16px] hover:border-white/10 transition-colors">
                                        <div className="col-span-5">
                                            <div className="flex items-center gap-2">
                                                {post.is_pinned && <Pin className="w-3 h-3 text-primary rotate-45 fill-primary/20" />}
                                                {post.is_locked && <Lock className="w-3 h-3 text-red-500 fill-red-500/20" />}
                                                <div className="font-bold text-white text-sm truncate pr-4">{post.title}</div>
                                            </div>
                                            <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5 font-mono">
                                                ID: {post.id.slice(0, 12)}
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="text-xs font-medium text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                {post.category}
                                            </span>
                                        </div>

                                        <div className="col-span-2 text-sm text-white/60 font-medium">
                                            {post.author?.display_name || post.author?.username || 'Unknown'}
                                        </div>

                                        <div className="col-span-3 flex justify-end gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handlePin(post.id, post.is_pinned)}
                                                className={`w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 ${post.is_pinned ? 'text-primary' : 'text-white/60'} hover:text-white`}
                                                title={post.is_pinned ? "Unpin Thread" : "Pin Thread"}
                                            >
                                                <Pin className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleLock(post.id, post.is_locked)}
                                                className={`w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 ${post.is_locked ? 'text-red-500' : 'text-white/60'} hover:text-white`}
                                                title={post.is_locked ? "Unlock Thread" : "Lock Thread"}
                                            >
                                                <Lock className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDeleteRequest(post.id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-500"
                                                title="Delete Thread"
                                            >
                                                <Trash className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-8 animate-in fade-in-50 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Notifications</h2>
                                <p className="text-white/40">Send system messages to all users or specific individuals.</p>
                            </div>
                            <AdminNotificationSender />
                        </TabsContent>

                        <TabsContent value="invites" className="space-y-8 animate-in fade-in-50 duration-500">
                            <InviteCodesManager />
                        </TabsContent>

                        <TabsContent value="downloads" className="space-y-8 animate-in fade-in-50 duration-500">
                            <AdminDownloadsManager uploads={uploads || []} />
                        </TabsContent>

                    </main>
                </Tabs>
            </div>

            <AdminUserEditSheet
                user={selectedUser}
                isOpen={isEditSheetOpen}
                onClose={() => setIsEditSheetOpen(false)}
                isCurrentUserAdmin={currentUser?.is_admin || false}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-[#09090b] border-white/10 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Are you sure you want to delete this thread? This action cannot be undone.
                            The author will be notified.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-widest text-white/50">Reason for Deletion</Label>
                            <Textarea
                                id="reason"
                                placeholder="Violation of community guidelines..."
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                className="bg-[#050505] border-white/10 text-white min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="text-white/60 hover:text-white">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                            Delete Thread
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
