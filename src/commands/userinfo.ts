import { ButtonBuilder, Colors, EmbedBuilder, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const command_data = new SlashCommandBuilder()
    .setName("userinfo")
    .setDMPermission(false)
    .setDescription(`Shows information on your stable horde account`)
    .addUserOption(
        new SlashCommandUserOption()
        .setName("user")
        .setDescription("The user to view")
        .setRequired(false)
    )

export default class extends Command {
    constructor() {
        super({
            name: "userinfo",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const commands = await ctx.interaction.guild?.commands.fetch()
        let token = await ctx.api_manager.getUserToken(ctx.interaction.options.getUser("user")?.id ?? ctx.interaction.user.id)
        if(!token && ctx.interaction.options.getUser("user")?.id) return ctx.error({error: "The user has not added their token"})
        const add_token_button = new ButtonBuilder({
            custom_id: "save_token",
            label: "Save Token",
            style: 1
        })
        if(!token) return ctx.interaction.reply({
            content: `Please add your token before your user details can be shown.\nThis is needed to perform actions on your behalf\n\nBy entering your token you agree to the ${commands?.find(c => c.name === "terms") ? `</terms:${commands?.find(c => c.name === "terms")!.id}>` : "/terms"}\n\n\nDon't know what the token is?\nCreate a stable horde account here: https://stablehorde.net/register`,
            components: [{type: 1, components: [add_token_button.toJSON()]}],
            ephemeral: true
        })

        const user_data = await ctx.api_manager.getUserData(token).catch(() => null)

        if(!user_data) return ctx.interaction.reply({
            content: "Unable to find user for saved token.",
            components: [{type: 1, components: [add_token_button.toJSON()]}],
            ephemeral: true
        })
        const props = []
        if(user_data.moderator) props.push("⚔️ Moderator")
        if(user_data.trusted) props.push("🤝 Trusted")
        if(user_data.suspicious) props.push(`Suspicious ${user_data.suspicious}`)
        const embed = new EmbedBuilder({
            color: Colors.Blue,
            footer: {text: `${props.join(" | ")}`},
            title: `${user_data.username}`,
            description: `Images Requested \`${user_data.usage?.requests}\` (\`${user_data.usage?.megapixelsteps}\` Megapixelsteps)
Images Generated \`${user_data.contributions?.fulfillments}\` (\`${user_data.contributions?.megapixelsteps}\` Megapixelsteps)
Allowed Concurrency \`${user_data.concurrency}\`

**Kudos**
Accumulated \`${user_data.kudos_details?.accumulated}\`
Gifted \`${user_data.kudos_details?.gifted}\`
Admin \`${user_data.kudos_details?.admin}\`
Received \`${user_data.kudos_details?.received}\`
Recurring \`${user_data.kudos_details?.recurring}\`

**Workers**
Invited \`${user_data.worker_invited}\`
Contributing \`${user_data.worker_count}\``,
        })

        ctx.interaction.reply({
            embeds: [embed.toJSON()]
        })
    }
}