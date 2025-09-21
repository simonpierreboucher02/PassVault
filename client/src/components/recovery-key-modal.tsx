import { useState } from "react";
import { AlertTriangle, Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface RecoveryKeyModalProps {
  isOpen: boolean;
  recoveryKey: string;
  onSaved: () => void;
}

export function RecoveryKeyModal({ isOpen, recoveryKey, onSaved }: RecoveryKeyModalProps) {
  const { toast } = useToast();
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      toast({
        title: "Recovery key copied",
        description: "Your recovery key has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy recovery key to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([recoveryKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "passvault-recovery-key.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Recovery key downloaded",
      description: "Your recovery key has been saved as a file.",
    });
  };

  const handleContinue = () => {
    if (hasConfirmed) {
      onSaved();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-recovery-key">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Save Your Recovery Key</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Important:</strong> This recovery key will only be shown once. 
              Save it in a secure location - you'll need it to reset your password if you forget it.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Your Recovery Key:</h3>
            <div className="bg-muted p-4 rounded-lg border-2 border-dashed border-border">
              <p className="font-mono text-sm break-all text-foreground" data-testid="text-recovery-key">
                {recoveryKey}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex-1"
              data-testid="button-copy-recovery-key"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              onClick={downloadAsFile}
              className="flex-1"
              data-testid="button-download-recovery-key"
            >
              <Download className="w-4 h-4 mr-2" />
              Download as File
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="confirm-saved"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                data-testid="checkbox-confirm-saved"
              />
              <label htmlFor="confirm-saved" className="text-sm text-foreground">
                I have saved my recovery key in a secure location
              </label>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!hasConfirmed}
              className="w-full"
              data-testid="button-continue"
            >
              {hasConfirmed ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Continue to PassVault
                </>
              ) : (
                "Please confirm you've saved your recovery key"
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>What is a recovery key?</strong></p>
            <p>
              Your recovery key allows you to reset your PassVault password if you forget it. 
              However, it cannot decrypt your stored passwords - those are encrypted with your 
              account password and remain secure even during recovery.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
