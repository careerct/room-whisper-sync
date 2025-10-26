-- Fix infinite recursion in room_members RLS by creating a security definer function
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Drop the problematic policy and recreate with the security definer function
DROP POLICY IF EXISTS "Room members are viewable by room members" ON room_members;

CREATE POLICY "Room members are viewable by room members"
ON room_members
FOR SELECT
USING (public.is_room_member(auth.uid(), room_id));

-- Also fix messages policy to use the same function
DROP POLICY IF EXISTS "Messages are viewable by room members" ON messages;

CREATE POLICY "Messages are viewable by room members"
ON messages
FOR SELECT
USING (public.is_room_member(auth.uid(), room_id));

DROP POLICY IF EXISTS "Room members can send messages" ON messages;

CREATE POLICY "Room members can send messages"
ON messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_room_member(auth.uid(), room_id)
);

-- Fix reactions policy
DROP POLICY IF EXISTS "Reactions are viewable by room members" ON message_reactions;

CREATE POLICY "Reactions are viewable by room members"
ON message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_reactions.message_id
    AND public.is_room_member(auth.uid(), m.room_id)
  )
);

-- Fix typing indicators policy
DROP POLICY IF EXISTS "Typing indicators are viewable by room members" ON typing_indicators;

CREATE POLICY "Typing indicators are viewable by room members"
ON typing_indicators
FOR SELECT
USING (public.is_room_member(auth.uid(), room_id));

-- Remove default rooms data (they were inserted in a previous migration)
DELETE FROM room_members WHERE room_id IN (
  SELECT id FROM rooms WHERE name IN ('General', 'Random', 'Tech Talk')
);
DELETE FROM rooms WHERE name IN ('General', 'Random', 'Tech Talk');