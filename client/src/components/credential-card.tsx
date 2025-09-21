import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User, Key, Edit2, MoreVertical, ExternalLink, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Credential } from "@shared/schema";
import { PasswordCrypto, analyzePasswordStrength } from "@/lib/crypto";
import { useAuth } from "@/hooks/use-auth";

interface CredentialCardProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
  onDelete: () => void;
}

export function CredentialCard({ credential, onEdit, onDelete }: CredentialCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/credentials/${credential.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Credential deleted",
        description: "The credential has been removed from your vault.",
      });
      onDelete();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} has been copied.`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const copyUsername = () => {
    copyToClipboard(credential.username, "Username");
  };

  const copyPassword = () => {
    if (!user) return;
    
    try {
      const masterKey = PasswordCrypto.generateMasterKey(user.username, user.password || "");
      const decryptedPassword = PasswordCrypto.decrypt(credential.encryptedPassword, masterKey);
      copyToClipboard(decryptedPassword, "Password");
    } catch (error) {
      toast({
        title: "Failed to decrypt",
        description: "Unable to decrypt password.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  const openUrl = () => {
    if (credential.url) {
      window.open(credential.url, "_blank", "noopener,noreferrer");
    }
  };

  // Analyze password strength (this is a simplified version since we can't decrypt here)
  const passwordStrength = analyzePasswordStrength(credential.encryptedPassword);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work": return "💼";
      case "social": return "👥";
      case "finance": return "🏦";
      case "shopping": return "🛒";
      case "entertainment": return "🎮";
      default: return "🔐";
    }
  };

  return (
    <Card className="p-6 hover:bg-muted/50 transition-colors" data-testid={`credential-card-${credential.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            {getCategoryIcon(credential.category)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground truncate" data-testid={`text-credential-name-${credential.id}`}>
              {credential.name}
            </h3>
            {credential.url && (
              <p className="text-sm text-muted-foreground truncate" data-testid={`text-credential-url-${credential.id}`}>
                {credential.url}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 truncate" data-testid={`text-credential-username-${credential.id}`}>
              {credential.username}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${passwordStrength.color}`}></div>
            <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyUsername}
            className="h-8 w-8 p-0"
            data-testid={`button-copy-username-${credential.id}`}
          >
            <User className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyPassword}
            className="h-8 w-8 p-0"
            data-testid={`button-copy-password-${credential.id}`}
          >
            <Key className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(credential)}
            className="h-8 w-8 p-0"
            data-testid={`button-edit-${credential.id}`}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-more-${credential.id}`}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {credential.url && (
                <DropdownMenuItem onClick={openUrl} data-testid={`button-open-url-${credential.id}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open URL
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={copyUsername} data-testid={`menu-copy-username-${credential.id}`}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Username
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyPassword} data-testid={`menu-copy-password-${credential.id}`}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
                data-testid={`button-delete-${credential.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
