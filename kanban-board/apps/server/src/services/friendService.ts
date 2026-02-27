import { supabaseAdmin } from '../supabase.js';

async function getProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, any>();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .in('id', userIds);
  return new Map((data ?? []).map((p: any) => [p.id, p]));
}

export async function getFriends(userId: string) {
  const { data: friendships, error } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
  if (!friendships || friendships.length === 0) return [];

  const userIds = new Set<string>();
  for (const f of friendships) {
    userIds.add(f.requester_id);
    userIds.add(f.addressee_id);
  }

  const profileMap = await getProfilesByIds(Array.from(userIds));

  return friendships.map((f: any) => ({
    ...f,
    requester: profileMap.get(f.requester_id) ?? null,
    addressee: profileMap.get(f.addressee_id) ?? null,
  }));
}

export async function getPendingRequests(userId: string) {
  const { data: friendships, error } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  if (!friendships || friendships.length === 0) return [];

  const requesterIds = friendships.map((f: any) => f.requester_id);
  const profileMap = await getProfilesByIds(requesterIds);

  return friendships.map((f: any) => ({
    ...f,
    requester: profileMap.get(f.requester_id) ?? null,
  }));
}

export async function getSentRequests(userId: string) {
  const { data: friendships, error } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .eq('requester_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  if (!friendships || friendships.length === 0) return [];

  const addresseeIds = friendships.map((f: any) => f.addressee_id);
  const profileMap = await getProfilesByIds(addresseeIds);

  return friendships.map((f: any) => ({
    ...f,
    addressee: profileMap.get(f.addressee_id) ?? null,
  }));
}

export async function sendFriendRequest(requesterId: string, email: string) {
  // Find user by email
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!profile) {
    throw new Error('해당 이메일의 사용자를 찾을 수 없습니다');
  }

  if (profile.id === requesterId) {
    throw new Error('자기 자신에게 친구 요청을 보낼 수 없습니다');
  }

  // Check if friendship already exists (either direction)
  const { data: existing } = await supabaseAdmin
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${requesterId},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${requesterId})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('이미 친구입니다');
    }
    if (existing.status === 'pending') {
      throw new Error('이미 친구 요청을 보냈거나 받은 상태입니다');
    }
    // rejected인 경우 기존 레코드 삭제 후 새로 생성
    await supabaseAdmin.from('friendships').delete().eq('id', existing.id);
  }

  const { data, error } = await supabaseAdmin
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: profile.id })
    .select('*')
    .single();

  if (error) throw error;

  const profileMap = await getProfilesByIds([requesterId, profile.id]);

  return {
    ...data,
    requester: profileMap.get(requesterId) ?? null,
    addressee: profileMap.get(profile.id) ?? null,
  };
}

export async function respondToRequest(friendshipId: string, userId: string, action: 'accept' | 'reject') {
  // Only addressee can respond
  const { data: friendship } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .single();

  if (!friendship) {
    throw new Error('친구 요청을 찾을 수 없습니다');
  }

  const newStatus = action === 'accept' ? 'accepted' : 'rejected';

  const { data, error } = await supabaseAdmin
    .from('friendships')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select('*')
    .single();

  if (error) throw error;

  const profileMap = await getProfilesByIds([data.requester_id, data.addressee_id]);

  return {
    ...data,
    requester: profileMap.get(data.requester_id) ?? null,
    addressee: profileMap.get(data.addressee_id) ?? null,
  };
}

export async function removeFriend(friendshipId: string, userId: string) {
  // Both sides can remove
  const { data: friendship } = await supabaseAdmin
    .from('friendships')
    .select('id')
    .eq('id', friendshipId)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .single();

  if (!friendship) {
    throw new Error('친구 관계를 찾을 수 없습니다');
  }

  const { error } = await supabaseAdmin.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}
