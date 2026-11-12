import { Chrome } from "../chrome";
import "../screen.css";
import "./about.css";

export default function AboutLayout({ children }: LayoutProps<"/about">) {
  return <Chrome active="About">{children}</Chrome>;
}
