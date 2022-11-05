import { ButtonBuilder, Colors, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { AutocompleteContext } from "../classes/autocompleteContext";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("team")
    .setDMPermission(false)
    .setDescription(`Shows information on a team`)
    .addStringOption(
        new SlashCommandStringOption()
        .setName("query")
        .setDescription("The ID or Name of the team")
        .setRequired(true)
        .setAutocomplete(true)
    )

export default class extends Command {
    constructor() {
        super({
            name: "team",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const query = ctx.interaction.options.getString("query")
        const teams = await ctx.stable_horde_manager.getTeams()
        const team = teams.find(t => t.id === query || t.name === query)
        if(query && team) {
            const delete_btn = new ButtonBuilder({
                label: "Delete this message",
                custom_id: `delete_${ctx.interaction.user.id}`,
                style: 4
            })
            console
            const embed = new EmbedBuilder({
                title: `Team Details`,
                color: Colors.Blue,
                description: `Name: \`${team.name}\`
Creator: \`${team.creater}\`
Info: ${team.info}

**Stats**
Requests Fulfilled: \`${team.requests_fulfilled}\`
Kudos: \`${team.kudos}\`
Online since: <t:${Math.floor(Date.now()/1000) - (team.uptime ?? 0)}:R>
Workers: \`${team.worker_count}\`
Performance: \`${team.performance}\` Megapixelsteps per second
Speed: \`${team.speed}\` Megapixelsteps per second`,
                footer: {text: team.id!}
            })

            ctx.interaction.reply({
                embeds: [embed],
                components: [{type: 1, components: [delete_btn]}]
            })
        } else {
            return ctx.error({error: "Unable to find team"})
        }
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        const option = context.interaction.options.getFocused(true)
        switch(option.name) {
            case "query": {
                const teams = await context.stable_horde_manager.getTeams()
                if(context.client.config.dev) console.log(teams)
                const available = teams.filter(t => t.name?.includes(option.value) || t.id?.includes(option.value)).map(t => ({name: `${t.name} | ${t.id}`, value: t.id!}))
                return await context.interaction.respond(available.slice(0, 25))
            }
        }
    }
}