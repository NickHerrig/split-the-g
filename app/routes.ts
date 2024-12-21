import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  { path: "score", file: "routes/score.tsx" }
] satisfies RouteConfig;
