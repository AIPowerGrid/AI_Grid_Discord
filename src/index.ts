import {readFileSync} from "fs"
import {ActivityType, ApplicationCommandType, InteractionType, PresenceUpdateStatus} from "discord.js";
import { StableHordeClient } from "./classes/client";
import { handleCommands } from "./handlers/commandHandler";
import { handleComponents } from "./handlers/componentHandler";
import { handleModals } from "./handlers/modalHandler";
import { Pool } from "pg"
import { handleAutocomplete } from "./handlers/autocompleteHandler";
import StableHorde from "@zeldafan0225/stable_horde";

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
for (const line of readFileSync(`${process.cwd()}/.env`, 'utf8').split(/[\r\n]/)) {
    const [, key, value] = line.match(RE_INI_KEY_VAL) || []
    if (!key) continue

    process.env[key] = value?.trim()
}

const connection = new Pool({
    user: process.env["DB_USERNAME"],
    host: process.env["DB_IP"],
    database: process.env["DB_NAME"],
    password: process.env["DB_PASSWORD"],
    port: Number(process.env["DB_PORT"]),
})

const client = new StableHordeClient({
    intents: ["Guilds"]
})

const stable_horde_manager = new StableHorde({
    default_token: client.config.default_token,
    cache_interval: 1000,
    cache: {
        models: 1000 * 10,
        performance: 1000 * 10
    }
})

client.login(process.env["DISCORD_TOKEN"])

if(client.config.logs?.enabled) {
    client.initLogDir()
}


connection.connect().then(async () => {
    await connection.query("CREATE TABLE IF NOT EXISTS user_tokens (index SERIAL, id VARCHAR(100) PRIMARY KEY, token VARCHAR(100) NOT NULL)")
}).catch(() => null);

client.on("ready", async () => {
    client.commands.loadClasses().catch(console.error)
    client.components.loadClasses().catch(console.error)
    client.modals.loadClasses().catch(console.error)
    client.user?.setPresence({activities: [{type: ActivityType.Listening, name: "to your generation requests | https://stablehorde.net"}], status: PresenceUpdateStatus.DoNotDisturb, })
    console.log(`Ready`)
    await client.application?.commands.set(client.commands.createPostBody()).catch(console.error)
})

client.on("interactionCreate", async (interaction) => {
    switch(interaction.type) {
        case InteractionType.ApplicationCommand: {
            switch(interaction.commandType) {
                case ApplicationCommandType.ChatInput: {
                    return await handleCommands(interaction, client, connection, stable_horde_manager);
                }
            }
            break;
        };
        case InteractionType.MessageComponent: {
			return await handleComponents(interaction, client, connection, stable_horde_manager);
        };
        case InteractionType.ApplicationCommandAutocomplete: {
			return await handleAutocomplete(interaction, client, connection, stable_horde_manager);
        };
        case InteractionType.ModalSubmit: {
			return await handleModals(interaction, client, connection, stable_horde_manager);
        };
    }
})