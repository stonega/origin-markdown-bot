import { Composer } from "grammy";
import { toHTML, toMarkdownV2 } from "@telegraf/entity";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.on("message", logHandle("unhandled-message"), (ctx) => {
	if (ctx.message.photo || ctx.message.video) {
		const md = toMarkdownV2({
			text: ctx.message.caption ?? "",
			entities: ctx.message.caption_entities as any,
		});
		const url = ctx.message.photo
			? ctx.message.photo.map((p) => p.file_id)[0]
			: ctx.message.video?.file_id;
		return ctx.reply(
			`Media ID	 \n<code>${url}</code> \n \nMarkdown \n<code>${md}</code>`,
			{
				parse_mode: "HTML",
			},
		);
	}
	const md = toMarkdownV2({
		text: ctx.message.text ?? "",
		entities: ctx.message.entities as any,
	});
	return ctx.reply(`Markdown\n<code>${md}</code>`, {
		parse_mode: "HTML",
	});
});

feature.on("callback_query", logHandle("unhandled-callback-query"), (ctx) => {
	return ctx.answerCallbackQuery();
});

export { composer as unhandledFeature };
