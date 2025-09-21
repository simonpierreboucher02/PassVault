import { useState, useEffect } from "react";
import { X, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PasswordGenerator, type PasswordGeneratorOptions } from "@/lib/password-generator";

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordGeneratorModal({ isOpen, onClose }: PasswordGeneratorModalProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Generate password whenever options change
  useEffect(() => {
    if (isOpen) {
      try {
        const password = PasswordGenerator.generate(options);
        setGeneratedPassword(password);
      } catch (error) {
        setGeneratedPassword("");
      }
    }
  }, [options, isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast({
        title: "Password copied",
        description: "Password has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy password to clipboard.",
        variant: "destructive",
      });
    }
  };

  const regeneratePassword = () => {
    try {
      const password = PasswordGenerator.generate(options);
      setGeneratedPassword(password);
      toast({
        title: "Password generated",
        description: "A new password has been generated.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Unable to generate password with current settings.",
        variant: "destructive",
      });
    }
  };

  const updateOption = <K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" data-testid="modal-password-generator">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Password Generator</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              data-testid="button-close-generator"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Length Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Length</Label>
              <span className="text-sm text-muted-foreground" data-testid="text-password-length">
                {options.length}
              </span>
            </div>
            <Slider
              value={[options.length]}
              onValueChange={([length]) => updateOption('length', length)}
              min={8}
              max={64}
              step={1}
              className="w-full"
              data-testid="slider-password-length"
            />
          </div>

          {/* Character Type Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
              <Switch
                id="uppercase"
                checked={options.uppercase}
                onCheckedChange={(checked) => updateOption('uppercase', checked)}
                data-testid="switch-uppercase"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase">Lowercase (a-z)</Label>
              <Switch
                id="lowercase"
                checked={options.lowercase}
                onCheckedChange={(checked) => updateOption('lowercase', checked)}
                data-testid="switch-lowercase"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="numbers">Numbers (0-9)</Label>
              <Switch
                id="numbers"
                checked={options.numbers}
                onCheckedChange={(checked) => updateOption('numbers', checked)}
                data-testid="switch-numbers"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="symbols">Symbols (!@#$%^&*)</Label>
              <Switch
                id="symbols"
                checked={options.symbols}
                onCheckedChange={(checked) => updateOption('symbols', checked)}
                data-testid="switch-symbols"
              />
            </div>
          </div>

          {/* Generated Password */}
          <div className="space-y-2">
            <Label>Generated Password</Label>
            <div className="relative">
              <Input
                value={generatedPassword}
                readOnly
                className="font-mono text-sm bg-muted pr-10"
                data-testid="input-generated-password"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                data-testid="button-copy-generated-password"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={regeneratePassword}
              className="flex-1"
              data-testid="button-regenerate-password"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              data-testid="button-copy-password"
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
