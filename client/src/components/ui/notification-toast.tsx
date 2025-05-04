import { useState, useEffect } from "react";
import { Toast, ToastDescription, ToastTitle } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "success" | "error" | "info";
  actionLabel?: string;
  actionHref?: string;
}

export function NotificationToast() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  // This is a placeholder for real-time notifications
  // In a real application, this would connect to a WebSocket or use polling
  useEffect(() => {
    // Simulate a notification after 5 seconds
    const timer = setTimeout(() => {
      const randomNotification: Notification = {
        id: "1",
        title: "Nova venda realizada!",
        description: "Seu produto foi vendido por R$ 97,00.",
        type: "success",
        actionLabel: "Ver detalhes",
        actionHref: "/sales"
      };
      
      setNotification(randomNotification);
      setVisible(true);
      
      // Show toast notification
      toast({
        title: randomNotification.title,
        description: randomNotification.description,
        variant: "default",
      });
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [toast]);

  if (!visible || !notification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Toast>
        <div className="flex items-start">
          <div className="mr-3 text-accent">
            {notification.type === "success" && <i className="fas fa-check-circle text-xl"></i>}
            {notification.type === "error" && <i className="fas fa-exclamation-circle text-xl"></i>}
            {notification.type === "info" && <i className="fas fa-info-circle text-xl"></i>}
          </div>
          <div className="mr-2">
            <ToastTitle>{notification.title}</ToastTitle>
            <ToastDescription>{notification.description}</ToastDescription>
            <div className="flex mt-2">
              {notification.actionLabel && notification.actionHref && (
                <a 
                  href={notification.actionHref} 
                  className="text-xs text-primary font-medium mr-3"
                >
                  {notification.actionLabel}
                </a>
              )}
              <button 
                onClick={() => setVisible(false)} 
                className="text-xs text-neutral-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </Toast>
    </div>
  );
}
