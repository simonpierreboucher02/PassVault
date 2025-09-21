import { Plus, Key, Briefcase, Users, Building, ShoppingCart, Gamepad2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SidebarProps {
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onAddCredential: () => void;
  onGeneratePassword: () => void;
  onImportExport: () => void;
}

const categories = [
  { id: "work", label: "Work", icon: Briefcase },
  { id: "social", label: "Social", icon: Users },
  { id: "finance", label: "Finance", icon: Building },
  { id: "shopping", label: "Shopping", icon: ShoppingCart },
  { id: "entertainment", label: "Entertainment", icon: Gamepad2 },
];

export function Sidebar({
  categoryCounts,
  selectedCategory,
  onCategorySelect,
  onAddCredential,
  onGeneratePassword,
  onImportExport,
}: SidebarProps) {
  const totalCredentials = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="lg:col-span-1">
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onAddCredential}
              className="w-full justify-start"
              data-testid="button-sidebar-add-credential"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
            <Button
              variant="outline"
              onClick={onGeneratePassword}
              className="w-full justify-start"
              data-testid="button-sidebar-generate-password"
            >
              <Key className="w-4 h-4 mr-2" />
              Generate Password
            </Button>
            <Button
              variant="outline"
              onClick={onImportExport}
              className="w-full justify-start"
              data-testid="button-sidebar-import-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Import / Export
            </Button>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "ghost"}
              onClick={() => onCategorySelect("all")}
              className="w-full justify-between"
              data-testid="button-category-all"
            >
              <span>All Credentials</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {totalCredentials}
              </span>
            </Button>

            {categories.map((category) => {
              const count = categoryCounts[category.id] || 0;
              const Icon = category.icon;

              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  onClick={() => onCategorySelect(category.id)}
                  className="w-full justify-between"
                  data-testid={`button-category-${category.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {count}
                  </span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Credentials</span>
              <span className="text-sm font-medium text-foreground" data-testid="text-total-credentials">
                {totalCredentials}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encrypted Storage</span>
              <span className="text-sm font-medium text-accent">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recovery Key</span>
              <span className="text-sm font-medium text-accent">Secured</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
