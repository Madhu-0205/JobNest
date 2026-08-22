"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Shield, MapPin } from "lucide-react";
import { Typography } from "@/components/ui/Typography";

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: () => void;
}

export function LocationPermissionDialog({ isOpen, onClose, onGrant }: LocationPermissionDialogProps) {const { t: i18nT } = useI18n();
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card max-w-sm p-6 border border-primary/20 bg-background/95 backdrop-blur-md rounded-2xl shadow-xl text-center">
        <DialogHeader className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="w-6 h-6 animate-bounce" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{i18nT("common.activateHyperlocalMap")}

          </DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <Typography variant="p" className="text-xs text-muted text-center leading-relaxed">{i18nT("common.jobnestMatchesYouWithNearbyJobsAvailableWorkers")}

          </Typography>
          
          <div className="flex items-start gap-2.5 mt-4 p-3 rounded-lg border border-border bg-card/40 text-left text-[11px] text-muted">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{i18nT("common.yourCoordinatesAreVerifiedUsingBuiltinAntispoofingAnd")}

            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full text-xs py-2 rounded-lg">{i18nT("common.useSearchInstead")}

          </Button>
          <Button variant="primary" size="sm" onClick={onGrant} className="w-full text-xs py-2 rounded-lg font-bold">{i18nT("common.allowGpsAccess")}

          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
export default LocationPermissionDialog;