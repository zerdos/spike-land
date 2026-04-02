import { Button } from "../lazy-imports/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/@/components/ui/tooltip";
import { FaDownload } from "../ui/@/external/icons";
import { FullscreenIcon } from "../ui/@/external/lucide-react";
import { motion } from "framer-motion";
import type { FC } from "react";
import { Share } from "../ui/components/icons";
import { QRButton } from "../ui/components/Qr.lazy";

interface ActionButtonsProps {
  codeSpace: string;
  handleDownload: () => void;
}

export const ActionButtons: FC<ActionButtonsProps> = ({ codeSpace, handleDownload }) => {
  return (
    <motion.div
      layout
      className="overflow-hidden"
      initial={{ height: 0, width: 0 }}
      animate={{ height: "100%", width: 88 }}
    >
      <TooltipProvider>
        <div className="p-4 flex overflow-hidden items-center flex-col space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.querySelector("#root")?.requestFullscreen()}
                aria-label="Teljes képernyő váltás"
              >
                <FullscreenIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Teljes képernyő váltás</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <QRButton url={`${location.origin}/live/${codeSpace}/`} />
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>QR kód megjelenítése</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(`/live/${codeSpace}/`)}
                aria-label="Megnyitás új ablakban"
              >
                <Share />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Megnyitás új ablakban</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                aria-label="Projekt letöltése"
              >
                <FaDownload />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Projekt letöltése</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </motion.div>
  );
};
