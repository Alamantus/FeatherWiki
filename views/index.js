import { homeView } from "./home";
import { settingsView } from "./settings";
import { taggedView } from "./tagged";
import { pageView } from "./page";

export const views = {
  h: { render: homeView },
  s: {
    name: 'Wiki Settings',
    render: settingsView,
  },
  t: { render: taggedView },
  p: { render: pageView },
};