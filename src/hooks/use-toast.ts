
// This file just re-exports from sonner for compatibility
import { toast } from "sonner";

// Create a hook that returns the toast function for components that prefer hooks
const useToast = () => {
  return toast;
};

export { useToast, toast };
