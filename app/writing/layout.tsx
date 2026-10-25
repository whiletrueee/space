import { Chrome } from "../chrome";
import "./writing.css";

export default function WritingLayout({ children }: LayoutProps<"/writing">) {
  return <Chrome active="Writing">{children}</Chrome>;
}
