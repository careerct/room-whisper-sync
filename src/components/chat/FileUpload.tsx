import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string) => void;
}

export const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-files")
        .getPublicUrl(fileName);

      onFileUploaded(publicUrl, selectedFile.name);
      setSelectedFile(null);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {selectedFile ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-chat-bubble rounded-lg">
          <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={uploadFile}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setSelectedFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button size="icon" variant="ghost" className="h-10 w-10" asChild>
            <span>
              <Paperclip className="w-5 h-5" />
            </span>
          </Button>
        </label>
      )}
    </div>
  );
};
