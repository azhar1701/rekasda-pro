import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  variant = 'danger'
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 rounded-sm shadow-2xl">
        <div className={cn(
          "h-1.5 w-full",
          variant === 'danger' ? "bg-red-600" : "bg-amber-500"
        )} />
        
        <div className="p-6">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-sm",
                variant === 'danger' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 border-none">
                {title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed mt-2 pt-2 border-t border-slate-100">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-sm border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-11"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 rounded-sm font-bold h-11 shadow-none",
                variant === 'danger' ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menghapus...
                </span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Permanen
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
