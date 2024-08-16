import type { AutoChatActionFlavor } from "@grammyjs/auto-chat-action";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { I18nFlavor } from "@grammyjs/i18n";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Update, UserFromGetMe } from "@grammyjs/types";
import {
	type Api,
	Context as DefaultContext,
	type SessionFlavor,
} from "grammy";
import type { Config } from "#root/config.js";
import type { Logger } from "#root/logger.js";

interface ExtendedContextFlavor {
	logger: Logger;
	config: Config;
}

export type Context = ParseModeFlavor<
	HydrateFlavor<
		DefaultContext &
			ExtendedContextFlavor &
			ConversationFlavor &
			I18nFlavor &
			AutoChatActionFlavor
	>
>;
export type ConversationContext = Conversation<Context>;

interface Dependencies {
	logger: Logger;
	config: Config;
}

export function createContextConstructor({ logger, config }: Dependencies) {
	return class extends DefaultContext implements ExtendedContextFlavor {
		logger: Logger;
		config: Config;

		constructor(update: Update, api: Api, me: UserFromGetMe) {
			super(update, api, me);

			this.logger = logger.child({
				update_id: this.update.update_id,
			});
			this.config = config;
		}
	} as unknown as new (
		update: Update,
		api: Api,
		me: UserFromGetMe,
	) => Context;
}
