
// use-toast.ts
// Re-export from sonner
import { toast } from "sonner";

// Maintain compatibility with any existing code using the useToast hook pattern
const useToast = () => {
  return {
    toast,
  };
};

export { useToast, toast };
