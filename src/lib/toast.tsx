import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";

export function showSavedToast(word: string) {
  toast.custom((id) => (
    <div
      onClick={() => toast.dismiss(id)}
      className="toast cursor-pointer transition-opacity"
      role="status"
    >
      <Check className="i-sm ok w-4 h-4 shrink-0" />
      <span>Saved “{word}”</span>
    </div>
  ));
}

export function showDeletedToast(word: string) {
  toast.custom((id) => (
    <div
      onClick={() => toast.dismiss(id)}
      className="toast cursor-pointer transition-opacity"
      role="status"
    >
      <Trash2 className="i-sm w-4 h-4 shrink-0" />
      <span>Deleted “{word}”</span>
    </div>
  ));
}
