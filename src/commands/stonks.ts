import { MessageEmbed, User } from "discord.js";
import { getHotReloadable } from "../loader.js";
import { Command } from "../types";
import { allMoneyFormat, getMul } from "../util.js";

export default {
    name: "stonks",
    description: "stonks",
    aliases: ["stats", "profile", "bal"],
    args: [{ type: "user", errorIfMissing: false, required: false, name: "user" }],
    async run(msg, user: User) {
        var { getUser } = getHotReloadable().eco
        var u = user || msg.author
        var data = await getUser(u)
        await msg.reply({
            embeds: [
                new MessageEmbed()
                    .setAuthor({ name: u.username, iconURL: u.displayAvatarURL() })
                    .setDescription(`Mone: ${allMoneyFormat(data.money)}\nMultiplier: ${data.multipliers.join(" * ")} (${getMul(data)})`)]
        })
    }
} as Command