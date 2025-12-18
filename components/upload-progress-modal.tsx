"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ScanProgress {
  fileName: string;
  stage: 'uploading' | 'complete' | 'error';
  progress: number;
}

interface UploadProgressModalProps {
  open: boolean;
  files: ScanProgress[];
}

export function UploadProgressModal({ open, files }: UploadProgressModalProps) {
  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };

  const getStatusText = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return 'Uploading...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[550px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Uploading Files</DialogTitle>
          <DialogDescription>
            Please wait while your files are being uploaded...
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {files.map((file, index) => (
            <div key={index} className="space-y-2 p-3 border border-border rounded-lg bg-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(file.stage)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusText(file.stage)}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold">
                  {file.progress}%
                </div>
              </div>
              
              <Progress value={file.progress} className="h-2" />
            </div>
          ))}
        </div>
        
        {files.every(f => f.stage === 'complete' || f.stage === 'error') && (
          <div className="text-center text-sm text-muted-foreground mt-2 p-2 bg-secondary/30 rounded">
            All files uploaded. Closing in 2 seconds...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
