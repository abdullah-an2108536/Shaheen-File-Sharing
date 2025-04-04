import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AlertModal({ fileName, onConfirm, onCancel }) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle>Delete File</DialogTitle>
          </div>
        </DialogHeader>
        <div className="text-gray-700">Are you sure you want to delete <div className= "text-red-600"> {fileName} </div> This action is irreversible.</div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
