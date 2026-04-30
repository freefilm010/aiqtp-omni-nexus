/**
 * Brand icon shims.
 *
 * lucide-react v1 removed company/brand logos (Twitter, LinkedIn, YouTube,
 * GitHub, Instagram, Facebook, Twitch) for trademark reasons. To preserve
 * existing imports across the codebase without touching every call site,
 * this module re-exports lucide's generic icons under the old brand names.
 *
 * If you need real, on-brand SVG marks, replace the import path on the
 * specific component with a dedicated brand-icon library (e.g. simple-icons).
 */
import {
  Bird,
  Briefcase,
  Play,
  Code2,
  Camera,
  Users,
  Tv,
} from "lucide-react";

export const Twitter = Bird;
export const Linkedin = Briefcase;
export const Youtube = Play;
export const Github = Code2;
export const Instagram = Camera;
export const Facebook = Users;
export const Twitch = Tv;