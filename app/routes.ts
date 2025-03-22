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
  route("collage", "./routes/collage.tsx"), 
  route("countryleaderboard", "./routes/countryleaderboard.tsx"), 
  route("past24hrleaderboard", "./routes/past24hrleaderboard.tsx"),
  route("faq", "./routes/faq.tsx"),
] satisfies RouteConfig;