import { Courier_Prime } from "next/font/google";
import { Chrome } from "../chrome";
import { Desk } from "./desk";
import "../writing/writing.css";
import "./films.css";

// Courier Prime: Courier's metrics, so a page sets like a 12-point screenplay, but drawn to be read
const script = Courier_Prime({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-script" });

export default function FilmsLayout({ children }: LayoutProps<"/films">) {
  return (
    <Chrome active="Films">
      <div className={`sp-root ${script.variable}`}>
        <Desk />
        {children}
      </div>
    </Chrome>
  );
}
