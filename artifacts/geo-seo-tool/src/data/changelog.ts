import { Sparkles, Wrench } from "lucide-react";
import releases from "./releases.json";

export const CHANGELOG = releases.entries.map(entry => ({
  ...entry,
  archive: "archive" in entry && entry.archive === true,
  date: new Date(entry.isoDate + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
  icon: entry.badge === "New" ? Sparkles : Wrench,
}));
