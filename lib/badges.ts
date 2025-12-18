export const BADGES_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
    donator: {
        label: "Donator",
        icon: "/donator_tier.png",
        description: "Supported the platform via donation",
    },
    early_access: {
        label: "Early Access",
        icon: "/earlyaccess_icon.png",
        description: "Joined during the early access phase",
    },
    admin: {
        label: "Admin",
        icon: "/admin_icon.png",
        description: "Platform Administrator",
    },
    moderator: {
        label: "Moderator",
        icon: "/moderator_icon.png",
        description: "Community Moderator",
    },
    owner: {
        label: "Owner",
        icon: "/owner_icon.png",
        description: "Platform Owner",
    },
    malware_analyst: {
        label: "Malware Analyst",
        icon: "/malware_analyser.png",
        description: "Verified Malware Analyst",
    },
};
