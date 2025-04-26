
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Trash2, FileText } from 'lucide-react';
import { toast } from './ui/use-toast';

interface FileObject {
  name: string;
  id: string;
}

export const FileList = ({ onDelete }: { onDelete: () => void }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from('documents').list();
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage.from('documents').remove([fileName]);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      onDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="grid gap-4 p-4">
      {files.length === 0 ? (
        <div className="text-center text-gray-500">No files uploaded yet</div>
      ) : (
        files.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <FileText className="text-gray-500" />
                <span className="font-medium">{file.name}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(file.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
