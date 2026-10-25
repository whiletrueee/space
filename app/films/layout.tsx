import { Chrome } from "../chrome";
import "../writing/writing.css";
import "./films.css";

export default function FilmsLayout({ children }: LayoutProps<"/films">) {
  return <Chrome active="Films">{children}</Chrome>;
}
