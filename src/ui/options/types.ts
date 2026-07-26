import type { BotConfig } from "../../shared/models";

// One editable account = an owner plus its token and bot. Backed by the two owner-keyed
// storage lists ("pats" + "bots"), merged for editing and split again on save.
export type Account = { owner: string; token: string; bot: BotConfig };
