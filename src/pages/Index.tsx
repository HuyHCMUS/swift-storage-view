
import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshFiles = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="text-3xl font-bold text-center mb-8">File Manager</h1>
      <div className="bg-white rounded-lg shadow-sm">
        <FileUpload onUploadComplete={refreshFiles} />
        <div className="border-t">
          <FileList key={refreshTrigger} onDelete={refreshFiles} />
        </div>
      </div>
    </div>
  );
};

export default Index;
