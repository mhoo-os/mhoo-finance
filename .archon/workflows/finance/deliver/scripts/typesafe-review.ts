import {run} from "./typesafe-review.mjs";
try { console.log(JSON.stringify(await run())); } catch { console.error("TYPESAFE_REVIEW_HELD: inspect private receipt; no acceptance claimed"); process.exitCode = 1; }
