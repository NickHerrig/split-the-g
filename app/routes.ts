import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("score/:splitId", "./routes/score.tsx"),
  route("leaderboard", "./routes/leaderboard.tsx"),
  route("api/email", "./routes/email.tsx"),
] satisfies RouteConfig;