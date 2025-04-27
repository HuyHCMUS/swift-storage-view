
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
      
      // Create file status record immediately
      await supabase
        .from('file_status')
        .insert({
          file_id: fileId,
          file_name: file.name,
          status: 'processing'
        });

      // Send to external API without waiting
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_id', fileId);
      formData.append('bot_id', 'a856a37f-f64e-4651-880e-3a68c969d527');
      formData.append('file_type', 'document');
      
      fetch('https://maibot-backend-knowledge.onrender.com/upload_file_pageindex', {
        method: 'POST',
        body: formData,
      }).then(async (apiResponse) => {
        if (!apiResponse.ok) {
          // Update status to error if API call fails
          await supabase
            .from('file_status')
            .update({ status: 'error' })
            .eq('file_id', fileId);
          
          toast({
            title: "Processing Error",
            description: "File uploaded but processing failed",
            variant: "destructive",
          });
        } else {
          // Update status to completed if API call succeeds
          await supabase
            .from('file_status')
            .update({ status: 'completed' })
            .eq('file_id', fileId);
          
          toast({
            title: "Success",
            description: "File processed successfully",
          });
        }
      }).catch(async (error) => {
        // Update status to error if API call throws
        await supabase
          .from('file_status')
          .update({ status: 'error' })
          .eq('file_id', fileId);
        
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to process file",
          variant: "destructive",
        });
      });

      onUploadComplete();
      toast({
        title: "Upload Success",
        description: "File uploaded and processing started",
      });
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
