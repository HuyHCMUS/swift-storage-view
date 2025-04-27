
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Trash2, FileText } from 'lucide-react';
import { toast } from './ui/use-toast';

interface FileStatus {
  file_id: string;
  file_name: string;
  status: 'processing' | 'completed' | 'error';
}

interface FileObject {
  name: string;
  id: string;
}

export const FileList = ({ onDelete }: { onDelete: () => void }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
    subscribeToFileStatus();
  }, []);

  const subscribeToFileStatus = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_status'
        },
        () => {
          fetchFileStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchFileStatuses = async () => {
    const { data } = await supabase
      .from('file_status')
      .select('*');
    
    if (data) {
      const statusMap = data.reduce((acc, status) => ({
        ...acc,
        [status.file_id]: status
      }), {});
      setFileStatuses(statusMap);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data: files, error } = await supabase.storage.from('documents').list();
      if (error) throw error;
      setFiles(files || []);
      await fetchFileStatuses();
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
      
      // Delete status record
      await supabase
        .from('file_status')
        .delete()
        .eq('file_id', fileName);
      
      // Call API to remove from backend
      const formData = new FormData();
      formData.append('file_id', fileName);
      
      const apiResponse = await fetch('https://maibot-backend-knowledge.onrender.com/remove_file_pageindex', {
        method: 'POST',
        body: formData,
      });
      
      if (!apiResponse.ok) {
        console.error(`API error: ${apiResponse.status}`);
      }
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      onDelete();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
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
              <div className="flex items-center space-x-4 flex-1">
                <FileText className="text-gray-500" />
                <div className="flex flex-col">
                  <span className="font-medium">{file.name}</span>
                  <span className={`text-sm ${getStatusColor(fileStatuses[file.name]?.status || 'processing')}`}>
                    {fileStatuses[file.name]?.status || 'processing'}
                  </span>
                </div>
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
