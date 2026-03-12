import colors from "colors";

export const logTheme = colors.setTheme({
  database: ["green", "bold"],
  server: ["white", "bold"],
  service: ["brightMagenta", "bold"],
  socket: ["brightCyan", "bold"],
  error: ["red", "bold"],
  success: ["brightGreen", "bold"],
  warning: ["yellow", "bold"],
  info: ["brightCyan", "bold"],
});
