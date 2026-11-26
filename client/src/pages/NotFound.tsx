import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Frog, MechButton, Card } from "@/components/ultra/UI";
export default function NotFound() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    if (window.location.pathname.replace(/\/$/, "") !== "/404")
      window.location.replace("/404");
    return () => robots.remove();
  }, []);
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card className="not-found-card">
        <Frog pose="support" className="not-found-frog" />
        <div className="eyebrow">OPS, ESTE SALTO FOI LONGE DEMAIS</div>
        <h1>Não encontramos esta página.</h1>
        <p className="muted">Vamos voltar para um caminho conhecido?</p>
        <MechButton onClick={() => navigate("/")}>
          <ArrowLeft size={17} /> Voltar ao início
        </MechButton>
      </Card>
    </main>
  );
}
