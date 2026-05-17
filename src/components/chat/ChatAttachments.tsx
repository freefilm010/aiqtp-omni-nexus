import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Paperclip,
  X,
  Image,
  FileText,
  File,
  Loader2,
  Upload,
} from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface ChatAttachmentsProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ChatAttachments = ({
  attachments,
  onAttachmentsChange,
  disabled,
}: ChatAttachmentsProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, file);

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(fileName);

        newAttachments.push({
          id: data.path,
          name: file.name,
          type: file.type,
          url: publicUrl,
          size: file.size,
        });
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
        toast.success(`${newAttachments.length} file(s) attached`);
      }
    } catch (err) {
      console.error("Error uploading files:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment Button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.csv,.txt,.json"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.type);
            const isImage = attachment.type.startsWith("image/");

            return (
              <div
                key={attachment.id}
                className="relative group flex items-center gap-2 p-2 bg-background rounded border"
              >
                {isImage ? (
                  <img
                    src={attachment.url}
                    alt={`Attachment preview: ${attachment.name}`}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <Icon className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="max-w-[100px]">
                  <p className="text-xs font-medium truncate">{attachment.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAttachment(attachment.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Display attachments in a message
export const MessageAttachments = ({ attachments }: { attachments: Attachment[] }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((attachment) => {
        const Icon = getFileIcon(attachment.type);
        const isImage = attachment.type.startsWith("image/");

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {isImage ? (
              <img
                src={attachment.url}
                alt={`Chat image attachment: ${attachment.name}`}
                className="max-h-40 max-w-xs rounded-lg border hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">{attachment.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
            )}
          </a>
        );
      })}
    </div>
  );
};

export default ChatAttachments;
