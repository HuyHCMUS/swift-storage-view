
import { ChangeEvent, useState } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './ui/use-toast';

export const FileUpload = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { error } = await supabase.storage
        .from('documents')
        .upload(`${Date.now()}-${file.name}`, file);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      onUploadComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full p-4">
      <label className="relative">
        <input
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <Button 
          className="w-full"
          disabled={isUploading}
        >
          <Upload className="mr-2" />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </label>
    </div>
  );
};
