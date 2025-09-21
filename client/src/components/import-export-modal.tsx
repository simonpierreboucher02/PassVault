import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import { Upload, Download, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { PasswordCrypto } from "@/lib/crypto";
import { type Credential, insertCredentialSchema } from "@shared/schema";
import { z } from "zod";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

export function ImportExportModal({ isOpen, onClose, onImportComplete }: ImportExportModalProps) {
  const { user, masterKey } = useAuth();
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: credentials = [] } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'json' | 'csv') => {
      if (!user || !masterKey) {
        throw new Error("User not authenticated or master key not available");
      }
      
      const decryptedCredentials: any[] = [];
      const errors: string[] = [];
      
      // Function to sanitize fields for CSV injection protection
      const sanitizeForCSV = (value: string): string => {
        if (!value) return value;
        // Check for formula injection characters at the start
        if (/^[=+\-@]/.test(value)) {
          return `'${value}`; // Prefix with single quote to neutralize
        }
        return value;
      };

      // Decrypt all passwords for export with error handling
      for (const cred of credentials) {
        try {
          const decryptedPassword = PasswordCrypto.decrypt(cred.encryptedPassword, masterKey);
          decryptedCredentials.push({
            name: sanitizeForCSV(cred.name),
            url: sanitizeForCSV(cred.url || ""),
            username: sanitizeForCSV(cred.username),
            password: sanitizeForCSV(decryptedPassword),
            category: sanitizeForCSV(cred.category),
          });
        } catch (error) {
          errors.push(`Failed to decrypt password for "${cred.name}"`);
          // Skip corrupted entries
        }
      }

      if (errors.length > 0) {
        console.warn("Export errors:", errors);
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(decryptedCredentials, null, 2);
        filename = `passvault-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format using Papa Parse for proper escaping
        content = Papa.unparse(decryptedCredentials, {
          header: true,
          quotes: true,
          quoteChar: '"',
          escapeChar: '"',
        });
        filename = `passvault-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      return { content, filename, mimeType, errors };
    },
    onSuccess: ({ content, filename, mimeType, errors }) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const message = errors && errors.length > 0 
        ? `Export completed with ${errors.length} warnings. Check console for details.`
        : `Your credentials have been exported to ${filename}`;

      toast({
        title: "Export successful",
        description: message,
        variant: errors && errors.length > 0 ? "destructive" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportFile(file || null);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!importFile || !user || !masterKey) {
      toast({
        title: "Import failed",
        description: "Authentication or master key not available. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    // File size check (10MB limit)
    if (importFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await importFile.text();
      let credentials: any[];

      if (importFile.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          credentials = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          throw new Error('Invalid JSON format');
        }
      } else if (importFile.name.endsWith('.csv')) {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim().toLowerCase(),
        });
        
        if (result.errors.length > 0) {
          throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
        }
        
        credentials = result.data;
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV files.');
      }

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process in chunks to avoid UI blocking for large files
      const CHUNK_SIZE = 50;
      for (let i = 0; i < credentials.length; i += CHUNK_SIZE) {
        const chunk = credentials.slice(i, i + CHUNK_SIZE);
        
        for (const cred of chunk) {
          try {
            // Validate using zod schema
            const validationResult = insertCredentialSchema.omit({ userId: true, encryptedPassword: true }).extend({
              password: z.string().min(1, "Password is required"),
            }).safeParse({
              name: cred.name,
              url: cred.url || null,
              username: cred.username,
              password: cred.password,
              category: cred.category || "other",
            });

            if (!validationResult.success) {
              failed++;
              errors.push(`Validation failed for "${cred.name || 'unknown'}": ${validationResult.error.issues.map(i => i.message).join(', ')}`);
              continue;
            }

            const validData = validationResult.data;
            const encryptedPassword = PasswordCrypto.encrypt(validData.password, masterKey);
            
            await apiRequest("POST", "/api/credentials", {
              name: validData.name,
              url: validData.url,
              username: validData.username,
              encryptedPassword,
              category: validData.category,
            });

            successful++;
          } catch (error) {
            failed++;
            errors.push(`Failed to import "${cred.name || 'unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // Small delay between chunks to prevent UI blocking
        if (i + CHUNK_SIZE < credentials.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setImportResult({ successful, failed, errors });
      
      if (successful > 0) {
        onImportComplete();
        toast({
          title: "Import completed",
          description: `Successfully imported ${successful} credential${successful !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`,
        });
      }

    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import credentials",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-import-export">
        <DialogHeader>
          <DialogTitle>Import / Export Credentials</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" data-testid="tab-export">Export</TabsTrigger>
            <TabsTrigger value="import" data-testid="tab-import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Export Credentials</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export all your credentials to a file. Passwords will be decrypted for export.
                </p>
                
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Security Warning:</strong> Exported files contain your passwords in plain text. 
                    Store them securely and delete them after use.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => exportMutation.mutate('json')}
                    disabled={exportMutation.isPending || credentials.length === 0}
                    className="flex-1"
                    data-testid="button-export-json"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as JSON
                  </Button>
                  <Button
                    onClick={() => exportMutation.mutate('csv')}
                    disabled={exportMutation.isPending || credentials.length === 0}
                    className="flex-1"
                    data-testid="button-export-csv"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </Button>
                </div>

                {credentials.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    No credentials to export
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Import Credentials</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Import credentials from a JSON or CSV file. Passwords will be encrypted before storage.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="import-file">Select File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileChange}
                    disabled={importing}
                    data-testid="input-import-file"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JSON, CSV
                  </p>
                </div>

                {importFile && (
                  <Alert>
                    <FileText className="w-4 h-4" />
                    <AlertDescription>
                      Ready to import from: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="w-full"
                  data-testid="button-import"
                >
                  {importing ? "Importing..." : "Import Credentials"}
                </Button>

                {importResult && (
                  <Alert className={importResult.failed === 0 ? "border-green-200" : "border-yellow-200"}>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>
                          <strong>Import completed:</strong> {importResult.successful} successful, {importResult.failed} failed
                        </p>
                        {importResult.errors.length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer font-medium">View errors ({importResult.errors.length})</summary>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}