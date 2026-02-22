import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "../services/auth";

export default function AuthTicket() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const ticket = searchParams.get("ticket");
    if (!ticket) {
      navigate("/login", { replace: true });
      return;
    }

    authService
      .exchangeWebLoginTicket(ticket)
      .then((laudoId) => {
        if (laudoId) {
          navigate(`/dashboard/laudos/${laudoId}/pdf`, { replace: true });
          return;
        }
        navigate("/dashboard/laudos", { replace: true });
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível autenticar pelo ticket"
        );
        navigate("/login", { replace: true });
      });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)]">Autenticando...</p>
      </div>
    </div>
  );
}
