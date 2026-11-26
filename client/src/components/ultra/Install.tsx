import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, CheckCircle2 } from "lucide-react";
import { MechButton, Modal } from "./UI";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function Install({ small = false }: { small?: boolean }) {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    );
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    const complete = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", complete);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  const install = async () => {
    if (!installEvent) {
      setHelp(true);
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };
  return (
    <>
      <MechButton
        small={small}
        color="purple"
        onClick={() => void install()}
        disabled={installed}
      >
        {installed ? <CheckCircle2 size={17} /> : <Download size={17} />}{" "}
        {installed ? "App instalado" : "Instalar aplicativo"}
      </MechButton>
      {help && (
        <Modal
          title="Sua jornada na tela inicial"
          onClose={() => setHelp(false)}
        >
          <p className="muted">
            O prompt depende do navegador, da publicação em HTTPS e do modo de
            abertura. Ele pode não aparecer dentro do Preview.
          </p>
          <div className="install-instructions">
            <h3>iPhone ou iPad</h3>
            <p>
              Abra o site publicado no Safari, toque em{" "}
              <Share size={15} style={{ display: "inline" }} /> Compartilhar e
              escolha <PlusSquare size={15} style={{ display: "inline" }} />{" "}
              <strong>Adicionar à Tela de Início</strong>.
            </p>
            <h3>Android ou desktop</h3>
            <p>
              Abra o site publicado no Chrome/Edge. No menu do navegador,
              escolha <strong>Instalar aplicativo</strong> ou{" "}
              <strong>Adicionar à tela inicial</strong>.
            </p>
            <p className="field-help">
              Esta versão contém manifesto e service worker próprios. O conteúdo
              disponível offline depende dos arquivos já carregados no
              dispositivo.
            </p>
          </div>
          <MechButton className="full-width" onClick={() => setHelp(false)}>
            Entendi
          </MechButton>
        </Modal>
      )}
    </>
  );
}
