-- Partie 6: Politiques RLS (Row Level Security)
-- Exécutez après la partie 5

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = public.messages.conversation_id 
        AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = public.messages.conversation_id 
        AND user_id = auth.uid()
    )
);

-- Communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Community members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view community members" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Leaderboards
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view leaderboards" ON public.leaderboards FOR SELECT USING (true);

-- Leaderboard entries
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view leaderboard entries" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Users can view own entries" ON public.leaderboard_entries FOR SELECT USING (auth.uid() = user_id);
