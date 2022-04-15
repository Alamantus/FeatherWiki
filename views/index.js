import { homeView } from "./home";
import { settingsView } from "./settings";
import { pageView } from "./page";

export const views = {
  h: { render: homeView },
  s: {
    name: 'Wiki Settings',
    render: settingsView,
  },
  p: { render: pageView },
};