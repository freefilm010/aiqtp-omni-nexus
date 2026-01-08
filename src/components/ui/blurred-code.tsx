import { useState } from "react";
import { Lock, Eye, EyeOff, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface BlurredCodeProps {
  code: string;
  className?: string;
  isOwner?: boolean;
  showUnlockButton?: boolean;
  onRequestAccess?: () => void;
}

export function BlurredCode({
  code,
  className,
  isOwner = false,
  showUnlockButton = true,
  onRequestAccess
}: BlurredCodeProps) {
  const { isAdmin } = useAdminAuth();
  const [revealed, setRevealed] = useState(false);

  // Admin and owner can always see code
  const canViewCode = isAdmin || isOwner;
  const shouldBlur = !canViewCode && !revealed;

  // Generate obfuscated preview
  const obfuscatedCode = code
    .split('\n')
    .map((line, i) => {
      if (i < 3) return line; // Show first 3 lines
      // Replace alphanumeric with dots
      return line.replace(/[a-zA-Z0-9]/g, '•');
    })
    .slice(0, 15)
    .join('\n');

  if (canViewCode) {
    return (
      <div className={cn("relative", className)}>
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 z-10 bg-background/80"
        >
          {isAdmin ? (
            <>
              <Crown className="h-3 w-3 mr-1 text-amber-500" />
              Admin View
            </>
          ) : (
            <>
              <Shield className="h-3 w-3 mr-1 text-green-500" />
              Owner Access
            </>
          )}
        </Badge>
        <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/60 backdrop-blur-sm rounded">
        <Lock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Algorithm Protected
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] text-center">
          Only strategy owner and admins can view this code
        </p>
        {showUnlockButton && onRequestAccess && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={onRequestAccess}
          >
            Request Access
          </Button>
        )}
      </div>
      <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto filter blur-sm select-none">
        <code>{shouldBlur ? obfuscatedCode : code}</code>
      </pre>
    </div>
  );
}

export function ProtectedCodeBadge() {
  return (
    <Badge variant="secondary" className="text-xs">
      <Lock className="h-3 w-3 mr-1" />
      Protected
    </Badge>
  );
}
