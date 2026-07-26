import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Switch } from "@/ui/components/switch";

// One settings block: heading + help text on a card. Replaces the repeated
// <section><h2>+<p> pattern the options page used 11 times.
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

// A labelled boolean toggle. Clicking the label text toggles too.
export function ToggleRow({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2${disabled ? " opacity-50" : ""}`}>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      <span
        className={`text-sm select-none${disabled ? "" : " cursor-pointer"}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        {children}
      </span>
    </div>
  );
}
