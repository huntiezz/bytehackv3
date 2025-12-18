import { createClient } from "@/lib/supabase/server";

export async function checkUserBan(userId: string) {
  const supabase = await createClient();

  const { data: banData } = await supabase.rpc('is_user_banned', {
    check_user_id: userId
  });

  if (banData && banData.length > 0 && banData[0].is_banned) {
    return {
      isBanned: true,
      type: 'banned',
      reason: banData[0].ban_reason,
      bannedBy: banData[0].banned_by_name || 'System',
      expiresAt: banData[0].expires_at,
      isPermanent: banData[0].is_permanent
    };
  }

  return { isBanned: false };
}

export async function checkIpBlacklist(ipAddress: string) {
  const supabase = await createClient();

  const { data: ipData } = await supabase.rpc('is_ip_blacklisted', {
    check_ip: ipAddress
  });

  if (ipData && ipData.length > 0 && ipData[0].is_blacklisted) {
    return {
      isBanned: true,
      type: 'blacklisted',
      reason: ipData[0].reason,
      bannedBy: ipData[0].banned_by_name || 'System',
      expiresAt: ipData[0].expires_at,
      isPermanent: ipData[0].is_permanent
    };
  }

  return { isBanned: false };
}

export function getBanRedirectUrl(banInfo: any) {
  const params = new URLSearchParams({
    type: banInfo.type,
    reason: banInfo.reason,
    bannedBy: banInfo.bannedBy,
    isPermanent: banInfo.isPermanent.toString(),
  });

  if (banInfo.expiresAt) {
    params.append('expiresAt', banInfo.expiresAt);
  }

  return `/banned?${params.toString()}`;
}
