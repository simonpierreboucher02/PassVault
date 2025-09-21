import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { X, Eye, EyeOff, Key, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PasswordCrypto } from "@/lib/crypto";
import { PasswordGenerator } from "@/lib/password-generator";
import { useAuth } from "@/hooks/use-auth";
import { type Credential } from "@shared/schema";

const credentialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  category: z.string().min(1, "Category is required"),
});

type CredentialFormData = z.infer<typeof credentialSchema>;

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  credential?: Credential | null;
}

const categories = [
  { value: "work", label: "Work", icon: "💼" },
  { value: "social", label: "Social", icon: "👥" },
  { value: "finance", label: "Finance", icon: "🏦" },
  { value: "shopping", label: "Shopping", icon: "🛒" },
  { value: "entertainment", label: "Entertainment", icon: "🎮" },
  { value: "other", label: "Other", icon: "🔐" },
];

export function CredentialModal({ isOpen, onClose, onSave, credential }: CredentialModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState("");

  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      name: "",
      url: "",
      username: "",
      password: "",
      category: "other",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CredentialFormData) => {
      if (!user) throw new Error("User not authenticated");

      const masterKey = PasswordCrypto.generateMasterKey(user.username, user.password || "");
      const encryptedPassword = PasswordCrypto.encrypt(data.password, masterKey);

      const payload = {
        name: data.name,
        url: data.url || null,
        username: data.username,
        encryptedPassword,
        category: data.category,
      };

      if (credential) {
        await apiRequest("PUT", `/api/credentials/${credential.id}`, payload);
      } else {
        await apiRequest("POST", "/api/credentials", payload);
      }
    },
    onSuccess: () => {
      toast({
        title: credential ? "Credential updated" : "Credential saved",
        description: credential ? "Your credential has been updated." : "Your credential has been saved securely.",
      });
      onSave();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: credential ? "Failed to update" : "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (credential) {
        // Decrypt password for editing
        if (user) {
          try {
            const masterKey = PasswordCrypto.generateMasterKey(user.username, user.password || "");
            const password = PasswordCrypto.decrypt(credential.encryptedPassword, masterKey);
            setDecryptedPassword(password);
            
            form.reset({
              name: credential.name,
              url: credential.url || "",
              username: credential.username,
              password: password,
              category: credential.category,
            });
          } catch (error) {
            toast({
              title: "Failed to decrypt",
              description: "Unable to decrypt password for editing.",
              variant: "destructive",
            });
          }
        }
      } else {
        form.reset({
          name: "",
          url: "",
          username: "",
          password: "",
          category: "other",
        });
        setDecryptedPassword("");
      }
    }
  }, [isOpen, credential, form, user, toast]);

  const handleClose = () => {
    setShowPassword(false);
    setDecryptedPassword("");
    form.reset();
    onClose();
  };

  const generatePassword = () => {
    const password = PasswordGenerator.generate({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    form.setValue("password", password);
  };

  const onSubmit = (data: CredentialFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="modal-credential">
        <DialogHeader>
          <DialogTitle>
            {credential ? "Edit Credential" : "Add New Credential"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Gmail, GitHub, Bank Account"
                      data-testid="input-credential-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com"
                        className="pr-10"
                        data-testid="input-credential-url"
                      />
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => window.open(field.value, "_blank", "noopener,noreferrer")}
                          data-testid="button-open-url"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username/Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="john@example.com"
                      data-testid="input-credential-username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="pr-20 font-mono"
                        data-testid="input-credential-password"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generatePassword}
                          className="h-6 w-6 p-0"
                          data-testid="button-generate-password-inline"
                        >
                          <Key className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-6 w-6 p-0"
                          data-testid="button-toggle-password-credential"
                        >
                          {showPassword ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-credential-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="flex items-center space-x-2">
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-credential"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="button-save-credential"
              >
                {saveMutation.isPending ? "Saving..." : credential ? "Update Credential" : "Save Credential"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
