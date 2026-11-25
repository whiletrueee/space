import { Chrome } from "../chrome";
import "../screen.css";
import "./projects.css";

export default function ProjectsLayout({ children }: LayoutProps<"/projects">) {
  return <Chrome active="Projects">{children}</Chrome>;
}
