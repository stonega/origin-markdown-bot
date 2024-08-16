import { run } from "@grammyjs/runner";
import { createBot } from "#root/bot/index.js";
import type { PollingConfig, WebhookConfig } from "#root/config.js";
import { config } from "#root/config.js";
import { createServer, createServerManager } from "#root/server/index.js";
import { logger } from "./logger.js";

async function startPolling(config: PollingConfig) {
	const bot = createBot(config.botToken, {
		config,
		logger,
	});
	// graceful shutdown
	onShutdown(async () => {
		logger.info("Shutdown");
		await runner?.stop();
	});

	await Promise.all([bot.init(), bot.api.deleteWebhook()]);

	// start bot
	const runner = run(bot, {
		runner: {
			fetch: {
				allowed_updates: config.botAllowedUpdates,
			},
		},
	});

	logger.info({
		msg: "Bot running...",
		username: bot.botInfo.username,
	});
}

async function startWebhook(config: WebhookConfig) {
	const bot = createBot(config.botToken, {
		config,
		logger,
	});
	const server = createServer({
		bot,
		config,
		logger,
	});
	const serverManager = createServerManager(server, {
		host: config.serverHost,
		port: config.port,
	});

	// graceful shutdown
	onShutdown(async () => {
		logger.info("Shutdown");
		serverManager.stop();
	});

	// to prevent receiving updates before the bot is ready
	await bot.init();

	// start server
	const info = serverManager.start();
	logger.info({
		msg: "Server started",
		url: info.url,
	});

	// set webhook
	await bot.api.setWebhook(config.botWebhook, {
		allowed_updates: config.botAllowedUpdates,
		secret_token: config.botWebhookSecret,
	});
	logger.info({
		msg: "Webhook was set",
		url: config.botWebhook,
	});
}

async function start() {
	try {
		if (config.isWebhookMode) await startWebhook(config);
		else if (config.isPollingMode) await startPolling(config);
	} catch (error) {
		logger.error(error);
		process.exit(1);
	}
}

// Utils

function onShutdown(cleanUp: () => Promise<void>) {
	let isShuttingDown = false;
	const handleShutdown = async () => {
		if (isShuttingDown) return;
		isShuttingDown = true;
		await cleanUp();
	};
	process.on("SIGINT", handleShutdown);
	process.on("SIGTERM", handleShutdown);
}

start();
