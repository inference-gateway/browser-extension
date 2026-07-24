import { Menu } from "./Menu";
import { Palette } from "./Palette";
import type { View } from "./types";

export function App({ view }: { view: View }) {
  if (!view) return null;
  return view.kind === "skill" ? <Menu {...view} /> : <Palette {...view} />;
}
