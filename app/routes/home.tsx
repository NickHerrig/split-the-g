import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Split the G" },
    { name: "description", content: "Put your skills to the test." },
  ];
}

export default function Home() {
  return <Welcome />;
}
