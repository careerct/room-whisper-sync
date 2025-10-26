-- Allow room creators to delete their own rooms
CREATE POLICY "Room creators can delete their rooms"
ON public.rooms
FOR DELETE
USING (auth.uid() = created_by);