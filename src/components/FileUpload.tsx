import { ChangeEvent, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './ui/use-toast';

export const FileUpload = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`${Date.now()}-${file.name}`, file);

      if (error) throw error;
      
      // Get file ID from Supabase response
      const fileId = data?.path || `${Date.now()}-${file.name}`;
      
      // Send to external API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_id', fileId);
      formData.append('bot_id', 'a856a37f-f64e-4651-880e-3a68c969d527');
      formData.append('file_type', 'document');
      
      const apiResponse = await fetch('https://maibot-backend-knowledge.onrender.com/upload_file_pageindex', {
        method: 'POST',
        body: formData,
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API request failed with status: ${apiResponse.status}`);
        
      }
      console.log(apiResponse);
      toast({
        title: "Success",
        description: "File uploaded and processed successfully",
      });
      onUploadComplete();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Failed to upload file",
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
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <Button 
          className="w-full"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2" />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </label>
    </div>
  );
};
