import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Key, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/sidebar";
import { CredentialCard } from "@/components/credential-card";
import { CredentialModal } from "@/components/credential-modal";
import { PasswordGeneratorModal } from "@/components/password-generator-modal";
import { ImportExportModal } from "@/components/import-export-modal";
import { type Credential } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isPasswordGeneratorOpen, setIsPasswordGeneratorOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

  const { data: credentials = [], refetch } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.url?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || credential.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = credentials.reduce((acc, cred) => {
    acc[cred.category] = (acc[cred.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleCredentialSaved = () => {
    refetch();
    setIsCredentialModalOpen(false);
    setEditingCredential(null);
  };

  const handleEditCredential = (credential: Credential) => {
    setEditingCredential(credential);
    setIsCredentialModalOpen(true);
  };

  const handleDeleteCredential = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="text-primary-foreground w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">PassVault</h1>
                  <p className="text-xs text-muted-foreground">by MinimalAuth.com</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPasswordGeneratorOpen(true)}
                data-testid="button-generate-password"
              >
                <Key className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-settings">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-accent-foreground">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground" data-testid="text-username">
                  {user?.username}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <Sidebar
            categoryCounts={categoryCounts}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onAddCredential={() => setIsCredentialModalOpen(true)}
            onGeneratePassword={() => setIsPasswordGeneratorOpen(true)}
            onImportExport={() => setIsImportExportOpen(true)}
          />

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search credentials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                    <Button
                      onClick={() => setIsCredentialModalOpen(true)}
                      className="flex items-center space-x-2"
                      data-testid="button-add-credential"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Credential</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Credentials List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {selectedCategory === "all" ? "All Credentials" : 
                       selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredCredentials.length} credential{filteredCredentials.length !== 1 ? 's' : ''} found
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredCredentials.length === 0 ? (
                    <div className="p-8 text-center">
                      <Shield className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No credentials found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first credential"}
                      </p>
                      <Button onClick={() => setIsCredentialModalOpen(true)} data-testid="button-add-first-credential">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Credential
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredCredentials.map((credential) => (
                        <CredentialCard
                          key={credential.id}
                          credential={credential}
                          onEdit={handleEditCredential}
                          onDelete={handleDeleteCredential}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => {
          setIsCredentialModalOpen(false);
          setEditingCredential(null);
        }}
        onSave={handleCredentialSaved}
        credential={editingCredential}
      />

      <PasswordGeneratorModal
        isOpen={isPasswordGeneratorOpen}
        onClose={() => setIsPasswordGeneratorOpen(false)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportComplete={refetch}
      />
    </div>
  );
}
