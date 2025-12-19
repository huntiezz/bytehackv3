'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

import { rateLimit } from '@/lib/rate-limit';

export async function toggleReaction(postId: string, emoji: string) {
    const user = await getCurrentUser()
    if (!user) {
        return { error: 'You must be logged in to react' } // this should never happen though cause you need to be signed in to view the skibidi ahh forum 
    }
    // Strict emoji validation: must be a single emoji character (including composite ones)
    // and definitely NOT just text letters/numbers.
    const isEmoji = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u.test(emoji);

    // Explicit check against common ASCII characters to be sure
    if (/^[a-zA-Z0-9]$/.test(emoji)) {
        return { error: 'Invalid emoji' }
    }
    if (!isEmoji || emoji.length > 5) {
        return { error: 'Invalid emoji' }
    }
    const { success } = await rateLimit(`reaction:${user.id}`, 10, 60);
    if (!success) {
        return { error: 'You are reacting too fast. Please wait.' }
    }

    const supabase = await createClient()

    const { count, error: countError } = await supabase
        .from('thread_reactions')
        .select('emoji', { count: 'exact', head: true })
        .eq('thread_id', postId)


    const { data: existingReaction } = await supabase
        .from('thread_reactions')
        .select('id')
        .eq('thread_id', postId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single()

    if (existingReaction) {
        await supabase.from('thread_reactions').delete().eq('id', existingReaction.id)
        revalidatePath(`/forum/${postId}`)
        return { success: true, action: 'removed' }
    }

    const { data: isEmojiPresent } = await supabase
        .from('thread_reactions')
        .select('id')
        .eq('thread_id', postId)
        .eq('emoji', emoji)
        .limit(1)

    if (!isEmojiPresent || isEmojiPresent.length === 0) {

        const { data: allReactions } = await supabase
            .from('thread_reactions')
            .select('emoji')
            .eq('thread_id', postId)

        const distinctEmojis = new Set(allReactions?.map(r => r.emoji))

        if (distinctEmojis.size >= 10) {
            return { error: 'Maximum of 10 unique reactions reached for this post.' }
        }
    }

    const { error } = await supabase.from('thread_reactions').insert({
        thread_id: postId,
        user_id: user.id,
        emoji: emoji
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/forum/${postId}`)
    return { success: true, action: 'added' }
}
