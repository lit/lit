<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./packages/lit/logo-dark.svg" alt="Lit" width="300" height="141">
  </source>
  <source media="(prefers-color-scheme: light)" srcset="./packages/lit/logo.svg" alt="Lit" width="300" height="141">
  </source>
  <img src="./packages/lit/logo.svg" alt="Lit" width="300" height="141">
</picture>

### Simple. Fast. Web Components.

[![Build Status](https://github.com/lit/lit/actions/workflows/tests.yml/badge.svg)](https://github.com/lit/lit/actions/workflows/tests.yml)
[![Published on npm](https://img.shields.io/npm/v/lit.svg?logo=npm)](https://www.npmjs.com/package/lit)
[![Join our Discord](https://img.shields.io/badge/discord-join%20chat-5865F2.svg?logo=discord&logoColor=fff)](https://lit.dev/discord/)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

</div>

Lit is a simple library for building fast, lightweight web components.

At Lit's core is a boilerplate-killing component base class that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive.

### Documentation

See the full documentation for Lit at [lit.dev](https://lit.dev).

Additional documentation for developers looking to contribute or understand more about the project can be found in [`dev-docs`](./dev-docs).

### npm

To install from npm:

```sh
npm i lit
```

## Lit Monorepo

This is the monorepo for Lit packages.

lit 2.x source is available on the [`2.x`](https://github.com/lit/lit/tree/2.x) branch.
lit-html 1.x source is available on the [`lit-html-1.x`](https://github.com/lit/lit/tree/lit-html-1.x) branch.

### Packages

- Core packages
  - [`lit`](./packages/lit) - The primary user-facing package of Lit which includes everything from lit-html and lit-element.
  - [`lit-element`](./packages/lit-element) - The web component base class used in Lit.
  - [`lit-html`](./packages/lit-html) - The rendering library used by LitElement.
  - [`@lit/reactive-element`](./packages/reactive-element) - A low level base class that provides a reactive lifecycle based on attribute/property changes.
- Additional libraries
  - [`@lit/localize`](./packages/localize) - A library and command-line tool for localizing web applications built using Lit.
  - [`@lit/localize-tools`](./packages/localize-tools) - Localization tooling for use with `@lit/localize`.
  - [`@lit/react`](./packages/react) - A React component wrapper for web components.
  - [`@lit/task`](./packages/task) - A controller for Lit that renders asynchronous tasks.
  - [`@lit/context`](./packages/context) - A system for passing data through a tree of elements using browser events, avoiding the need to pass properties down every layer of the tree using [a community defined protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).
- Labs
  - [`@lit-labs/ssr`](./packages/labs/ssr) - A server package for rendering Lit templates and components on the server.
  - [`@lit-labs/ssr-client`](./packages/labs/ssr-client) - A set of client-side support modules for rendering Lit components and templates on the server using `@lit-labs/ssr`.
  - [`@lit-labs/eleventy-plugin-lit`](./packages/labs/eleventy-plugin-lit) - A plugin for Eleventy that pre-renders
    Lit components using `@lit-labs/ssr` with optional hydration.
  - [`@lit-labs/ssr-react`](./packages/labs/ssr-react) - A package for integrating Lit SSR with React and React frameworks.
  - [`@lit-labs/nextjs`](./packages/labs/nextjs) - A plugin for [Next.js](https://nextjs.org/) that enables deep server rendering of Lit components with Lit SSR.
  - [`@lit-labs/router`](./packages/labs/router) - A router for Lit.
  - [`@lit-labs/motion`](./packages/labs/motion) - Lit directives for making things move
  - [`@lit-labs/scoped-registry-mixin`](./packages/labs/scoped-registry-mixin) - A mixin for LitElement that integrates with the speculative Scoped CustomElementRegistry polyfill.
  - [`@lit-labs/observers`](./packages/labs/observers) - A set of reactive controllers that facilitate using the platform observer objects.
  - [`@lit-labs/preact-signals`](./packages/labs/preact-signals) - [Preact Signals](https://preactjs.com/guide/v10/signals/) integration for Lit.
  - [`@lit-labs/signals`](./packages/labs/signals) - [TC39 proposal Signals](https://github.com/tc39/proposal-signals) integration for Lit.
  - [`@lit-labs/testing`](./packages/labs/testing) - Utilities for testing Lit components.
  - [`@lit-labs/virtualizer`](./packages/labs/virtualizer) - Viewport-based virtualization (including virtual scrolling).
  - [`@lit-labs/compiler`](./packages/labs/compiler) - A compiler for optimizing Lit templates.
- Starter kits (not published to npm)
  - [`lit-starter-ts`](./packages/lit-starter-ts) ([template
    repo](https://github.com/lit/lit-element-starter-ts)) - A starter repo for building reusable components using Lit in TypeScript.
  - [`lit-starter-js`](./packages/lit-starter-js) ([template
    repo](https://github.com/lit/lit-element-starter-js)) - A starter repo for building reusable components using Lit in JavaScript.
- Internal packages (not published to npm)
  - [`tests`](./packages/tests) - Test infrastructure for the monorepo.
  - [`benchmarks`](./packages/benchmarks) - Benchmarks for testing various libraries in the monorepo.
  - [`@lit-internal/scripts`](./packages/@lit-internal/scripts) - Utility scripts used within the monorepo.

## Contributing to Lit

Lit is open source and we appreciate issue reports and pull requests. See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

### Setting up the lit monorepo for development

Initialize repo:

```sh
git clone https://github.com/lit/lit.git
cd lit
npm ci
```

Build all packages:

```sh
npm run build
```

Test all packages:

```sh
npm run test
```

Run benchmarks for all packages:

```sh
npm run benchmarks
```

See individual package READMEs for details on developing for a specific package.


## 🌐 Web Resources & Interactive Index
- [STOCKINGS DILEMMA](https://iskillplay.web.app/stockings-dilemma.html)
- [CATEGORY COLOR197](https://themindskillplayplay.pages.dev/category-color197.html)
- [CATEGORY RACING DRIVING](https://themindplays.pages.dev/category-racing-driving.html)
- [INDEX10](https://themindplaying.web.app/index10.html)
- [TOY ASSEMBLY 3D](https://themindplay.github.io/toy-assembly-3d.html)
- [HOLE DIGGER](https://themindskillplayplay.pages.dev/hole-digger.html)
- [JUMP IN TO THE PLANE](https://iskillquest.pages.dev/jump-in-to-the-plane.html)
- [WIRED CHICKEN INC](https://themindskillplayplay.pages.dev/wired-chicken-inc.html)
- [CATEGORY BASKETBALL 2](https://themindplays.pages.dev/category-basketball-2.html)
- [CATEGORY DRAGON22](https://themindplay.github.io/category-dragon22.html)
- [MURDERERS VS SHERIFFS DUELS](https://iskillquest.pages.dev/murderers-vs-sheriffs-duels.html)
- [CATEGORY COLOR195](https://themindplays.pages.dev/category-color195.html)
- [MAHJONG AT HOME SCANDINAVIAN EDITION](https://themindplays.pages.dev/mahjong-at-home-scandinavian-edition.html)
- [BASKETBALL STARS 2026](https://themindskillplayplay.pages.dev/basketball-stars-2026.html)
- [ENCHANTED MAHJONG SAGA](https://iskillquest.pages.dev/enchanted-mahjong-saga.html)
- [POLYGON SPACE](https://iskillquest.pages.dev/polygon-space.html)
- [MERGE CHRISTMAS](https://themindskillplayplay.pages.dev/merge-christmas.html)
- [CATEGORY BRAIN260](https://skillplay.github.io/category-brain260.html)
- [PUSH IT 3D](https://themindplay.github.io/push-it-3d.html)
- [WORM PUZZLE SNAKE APPLE](https://themindplays.pages.dev/worm-puzzle-snake-apple.html)
- [FARM OF WORDS](https://skillplay.github.io/farm-of-words.html)
- [CATEGORY CASUAL 9](https://themindskillplayplay.pages.dev/category-casual-9.html)
- [LEAP AND AVOID 2](https://skillplay.github.io/leap-and-avoid-2.html)
- [GAS STATION STICK SIMULATOR](https://iskillquest.pages.dev/gas-station-stick-simulator.html)
- [SORT MY PARKING AREA](https://skillplay.github.io/sort-my-parking-area.html)
- [DUCK LUCK](https://iskillquest.pages.dev/duck-luck.html)
- [BMG CRASHDAY 2025](https://iskillquest.pages.dev/bmg-crashday-2025.html)
- [TOY MATCH 3](https://themindskillplayplay.pages.dev/toy-match-3.html)
- [PAWS OFF MY CLUES](https://themindplays.pages.dev/paws-off-my-clues.html)
- [WORLD SOLITAIRE TRIPEAKS ](https://iskillquest.pages.dev/world-solitaire-tripeaks-.html)
- [ABOUT A FROG](https://iskillquest.pages.dev/about-a-frog.html)
- [VALENTINES LOVE LINK](https://skillplay.github.io/valentines-love-link.html)
- [BOAT MANIA](https://themindskillplayplay.pages.dev/boat-mania.html)
- [CATEGORY SCHOOL](https://themindplay.pages.dev/category-school.html)
- [CAT LIFE MERGE MONEY](https://iskillquest.pages.dev/cat-life-merge-money.html)
- [ELLIES RECIPE DUBAI CHOCOLATE BAR](https://iskillquest.pages.dev/ellies-recipe-dubai-chocolate-bar.html)
- [OBBY ESCAPE BARRYS JAIL PARKOUR](https://themindplaying.web.app/obby-escape-barrys-jail-parkour.html)
- [FAMILY SIMULATOR BEACH GAMES](https://themindplay.pages.dev/family-simulator-beach-games.html)
- [FIND HIDDEN SECRETS](https://iskillquest.pages.dev/find-hidden-secrets.html)
- [LITTLE COMMANDER RED VS BLUE](https://skillplay.github.io/little-commander-red-vs-blue.html)
- [ANNAS STORY DRESS UP DIY](https://iskillquest.pages.dev/annas-story-dress-up-diy.html)
- [WORD HUNT](https://themindplay.github.io/word-hunt.html)
- [ROBBIE STAND ON THE RIGHT COLOR](https://themindplay.github.io/robbie-stand-on-the-right-color.html)
- [CATEGORY MOBILE2 095](https://themindplaying.web.app/category-mobile2-095.html)
- [CRASH CAR PARKOUR SIMULATOR](https://skillplay.github.io/crash-car-parkour-simulator.html)
- [SHOOT N CRUSH](https://themindplays.pages.dev/shoot-n-crush.html)
- [PRIVACY](https://themindplaying.web.app/privacy.html)
- [GRASS DEFENSE](https://themindplays.pages.dev/grass-defense.html)
- [MAHJONG SOLITAIRE ZODIAC](https://themindskillplayplay.pages.dev/mahjong-solitaire-zodiac.html)
- [2 PLAYER ONLINE CHESS](https://iskillquest.pages.dev/2-player-online-chess.html)
- [INDEX15](https://themindplaying.web.app/index15.html)
- [ESCAPE THE HORROR CRAFT](https://themindplays.pages.dev/escape-the-horror-craft.html)
- [BUBBLE AROUND](https://themindskillplayplay.pages.dev/bubble-around.html)
- [PRINCESSES OF QUADROBICS](https://themindplaying.web.app/princesses-of-quadrobics.html)
- [LIMITED KABOOM](https://themindplay.pages.dev/limited-kaboom.html)
- [CATEGORY SOLITAIRE](https://themindskillplayplay.pages.dev/category-solitaire.html)
- [LARRY WORLD](https://themindplay.pages.dev/larry-world.html)
- [NUMBER MERGE 10](https://iskillquest.pages.dev/number-merge-10.html)
- [TSUNAMI BRAINROTS ONLINE](https://themindplay.pages.dev/tsunami-brainrots-online.html)
- [CREEPY DRESS UP](https://themindskillplayplay.pages.dev/creepy-dress-up.html)
- [CATEGORY SOCCER](https://themindskillplayplay.pages.dev/category-soccer.html)
- [CATEGORY STICKMAN](https://themindskillplayplay.pages.dev/category-stickman.html)
- [IDLE LUNCH](https://themindplays.pages.dev/idle-lunch.html)
- [CATEGORY BIKE 3](https://themindplays.pages.dev/category-bike-3.html)
- [RUN NOW](https://themindplays.pages.dev/run-now.html)
- [BOUNCY BLOB RACE OBSTACLE COURSE](https://iskillquest.pages.dev/bouncy-blob-race-obstacle-course.html)
- [INDEX20](https://themindplaying.web.app/index20.html)
- [CATEGORY CASUAL](https://themindplays.pages.dev/category-casual.html)
- [RUN FROM BABA YAGA](https://themindplay.pages.dev/run-from-baba-yaga.html)
- [EUROPE AT WAR](https://themindplay.github.io/europe-at-war.html)
- [POTTERY MASTER](https://themindplays.pages.dev/pottery-master.html)
- [BRAIN PUZZLES QUESTS](https://themindplays.pages.dev/brain-puzzles-quests.html)
- [SKY MAZE CHALLENGE](https://themindplaying.web.app/sky-maze-challenge.html)
- [MAGIC KINGDOM HEX MATCH](https://iskillquest.pages.dev/magic-kingdom-hex-match.html)
- [BFFS Y2K FASHION](https://themindplays.pages.dev/bffs-y2k-fashion.html)
- [SAND SORT COLOR PUZZLE GAME](https://themindskillplayplay.pages.dev/sand-sort-color-puzzle-game.html)
- [BUBBLE ESCAPE](https://skillplay.github.io/bubble-escape.html)
- [EASTER GLAMPING TRIP](https://themindskillplayplay.pages.dev/easter-glamping-trip.html)
- [BARK BLAST](https://themindplay.github.io/bark-blast.html)
- [DROP BRICKS BREAKER](https://themindplay.pages.dev/drop-bricks-breaker.html)
- [HOME RUSH THE FISH WAR](https://themindplays.pages.dev/home-rush-the-fish-war.html)
- [JIGSOLITAIRE](https://skillplay.github.io/jigsolitaire.html)
- [LINK FLOW](https://themindplay.github.io/link-flow.html)
- [TOILET RUSH](https://themindplays.pages.dev/toilet-rush.html)
- [MATCH ARENA](https://themindplays.pages.dev/match-arena.html)
- [SHIPS 3D IO](https://themindskillplayplay.pages.dev/ships-3d-io.html)
- [STYLE ICONS 2024 REWIND EDITION](https://thelearnquester.web.app/style-icons-2024-rewind-edition.html)
- [WINTER MAZE](https://themindplay.github.io/winter-maze.html)
- [PAW CLASH](https://studyplaying.github.io/paw-clash.html)
- [CATEGORY MINECRAFT](https://learnquester.github.io/category-minecraft.html)
- [CATEGORY 1 PLAYER139](https://themindplay.pages.dev/category-1-player139.html)
- [TRAFFIC RACING](https://themindplays.pages.dev/traffic-racing.html)
- [STICK TACTICS DESTRUCTION](https://learnquester.github.io/stick-tactics-destruction.html)
- [STICKMAN ARCHERO FIGHT STICK SHADOW FIGHT WAR](https://learnquester.github.io/stickman-archero-fight-stick-shadow-fight-war.html)
- [CATEGORY SOLITAIRE27](https://themindplay.github.io/category-solitaire27.html)
- [BEARS VS ART](https://studyplayings.pages.dev/bears-vs-art.html)
- [SMALL WARDROBE](https://themindplays.pages.dev/small-wardrobe.html)
- [CONTACT](https://quizverses.pages.dev/contact.html)
- [MEMEVOIO](https://themindskillplayplay.pages.dev/memevoio.html)
- [SEAT JAM 3D](https://studyplayings.pages.dev/seat-jam-3d.html)
- [MAGIC TILES 3](https://themindskillplayplay.pages.dev/magic-tiles-3.html)
- [OIL DIGGING](https://thelearnquesters.pages.dev/oil-digging.html)
- [CATEGORY QUIZ](https://themindskillplayplay.pages.dev/category-quiz.html)
- [ASMR BEAUTY HOMELESS](https://themindplay.pages.dev/asmr-beauty-homeless.html)
- [DROP ANIMALS](https://themindplay.pages.dev/drop-animals.html)
- [CATEGORY SIMULATION](https://themindplay.github.io/category-simulation.html)
- [CATEGORY WATER39](https://themindskillplayplay.pages.dev/category-water39.html)
- [PATO VS COPS](https://studyquests.pages.dev/pato-vs-cops.html)
- [BASKET SWAP](https://skillplay.github.io/basket-swap.html)
- [CATEGORY HORROR 2](https://quizverses.github.io/category-horror-2.html)
- [CATEGORY STICKMAN](https://thelearnquester.web.app/category-stickman.html)
- [PUZZLE BLOCKS FILL IT COMPLETELY](https://themindplaying.web.app/puzzle-blocks-fill-it-completely.html)
- [CONTACT](https://themindplaying.web.app/contact.html)
- [PIZZA MAKER](https://thelearnquesters.pages.dev/pizza-maker.html)
- [POLICE TRAFFIC RACER](https://themindplay.pages.dev/police-traffic-racer.html)
- [FIND RESTORE HIDDEN PUZZLE](https://themindplay.pages.dev/find-restore-hidden-puzzle.html)
- [SKIBIDI TOILET VS CAMERAMAN SNIPER GAME](https://themindskillplayplay.pages.dev/skibidi-toilet-vs-cameraman-sniper-game.html)
- [ANIME COUPLE AVATAR MAKER](https://learnquesters.pages.dev/anime-couple-avatar-maker.html)
- [DIAMONDZ](https://thequizzone.pages.dev/diamondz.html)
- [REAL DRIVING SIMULATOR](https://themindplays.pages.dev/real-driving-simulator.html)
- [MAHJONG CONNECT COOKWARE](https://learnquesters.pages.dev/mahjong-connect-cookware.html)
- [FARM MERGE HARVEST](https://learnquester.github.io/farm-merge-harvest.html)
- [LITTLE CANDY BAKERY](https://iskillquest.pages.dev/little-candy-bakery.html)
- [CATEGORY CANNON22](https://themindplays.pages.dev/category-cannon22.html)
- [2048SKILL EDITION](https://themindplay.pages.dev/2048skill-edition.html)
- [REAL MOTORBIKE SUPER HERO STUNT 3D](https://studyquests.pages.dev/real-motorbike-super-hero-stunt-3d.html)
- [YOUTUBER MCRAFT 2PLAYER](https://skillplay.github.io/youtuber-mcraft-2player.html)
- [MUSTANG CITY DRIVER](https://studyquests.pages.dev/mustang-city-driver.html)
- [STICK HERO BATTLE](https://themindplays.pages.dev/stick-hero-battle.html)
- [CAPYBARA GO](https://themindplaying.web.app/capybara-go.html)
