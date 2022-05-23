import { Collection, User } from "discord.js";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { getData } from "../data.js";
import { CurrencyID, Money, OptionalMoney, UserData } from "../types";
import { multiplyMoney } from "../util.js";

//@ts-ignore
// var item = new ItemType("Egg", 5000)
// var item = {
//     name: "Egg",
//     price: 5000,
// }
interface ItemTypeData {
    name?: string,
    icon?: string,
    price?: OptionalMoney
    description?: string,
    onUse?: (u: UserData, a: bigint) => [bigint, string] | void
}
interface ItemType extends ItemTypeData { }
class ItemType {
    name: string
    icon: string
    price: OptionalMoney = {}
    constructor(name: string, icon: string, obj?: ItemTypeData) {
        this.name = name
        this.icon = icon
        if (obj) {
            for (var k in obj) {
                //@ts-ignore
                this[k] = obj[k]
            }
        }
    }
}
var users: Collection<string, UserData> = new Collection()
var items: Collection<string, ItemType> = new Collection()

items.set("spaghet", new ItemType("Spaghet", "🍝", { price: { points: 1000n, gold: 10n }, onUse: (u, a) => void addMul(u, 0, 1n * a) }))
items.set("egg", new ItemType("Egg", "🥚", { price: { points: 1000000n, gold: 5000n } }))
items.set("bread", new ItemType("Bread", "🍞", {
    price: { points: 500n / 3n },
    description: "Increases multiplier[0] by 1/10 per item (rounded down)",
    onUse: (u, a) => void addMul(u, 0, 1n * a / 10n)
}))
items.set("cookie", new ItemType("Cookie", "🍪", {
    price: { points: 500n / 3n / 5n },
    description: "Increases multiplier[0] by 1/50 per item (rounded down)",
    onUse: (u, a) => void addMul(u, 0, 1n * a / 50n)
}))
items.set("baguette", new ItemType("Baguette", "🥖", {
    price: { points: 500n },
    description: "Increases multiplier[0] by 1/3 per item (rounded down)",
    onUse: (u, a) => void addMul(u, 0, 1n * a / 3n)
}))
items.set("lottery_ticket", new ItemType("Lottery Ticket", "🎫", {
    price: { points: 5n * 10n ** 6n, gold: 25n * 10n ** 3n },
    description: "Has a chance to either double or cut in half your points",
    onUse: (u, a) => {
        if (Math.random() < 0.5 + Math.sin(Date.now()) / 10) {
            u.money.points *= 2n
            return [a, "Get fake"]
        } else {
            u.money.points /= 2n
            return [a, "Get real"]
        }
    }
}))
items.set("milk", new ItemType("Milk", "🥛", {
    price: { points: 29999n },
    description: "milk gud for ur bones n ur stonks",
    onUse: (u, a) => {
        addMul(u, 1, 1n * a)
    }
}))
items.set("avocado", new ItemType("Avocado", "🥑", {
    price: { points: 6200n },
    onUse: (u, a) => void addMul(u, 0, 1n + a * 6n + (a / 10n * 9n)),
}))

items.sort((a, b, ak, bk) => Number(Object.values(b.price).reduce((prev, cur) => prev + cur, 0n) -
    Object.values(a.price).reduce((prev, cur) => prev + cur, 0n)))

function addMul(u: UserData, i: number, amt: bigint) {
    if (!u.multipliers[i]) {
        u.multipliers[i] = 1n
        u.multipliers.forEach((v, i) => u.multipliers[i] = v ?? 1)
    }
    u.multipliers[i] += amt
}
async function getUser(user: User): Promise<UserData> {
    if (users.has(user.id)) return users.get(user.id) as UserData
    var o = await getData(user.id)
    var obj: UserData = {
        money: { points: 3000n, gold: 150n },
        multipliers: [1n],
        items: {},
        ...o,
    }
    users.set(user.id, obj)
    return obj
}
async function saveUser(id: string | User): Promise<void> {
    if (id instanceof User) id = id.id;
    if (!users.has(id)) return
    await writeFile(`data/${id}.json`, JSON.stringify(users.get(id), (_, v) => {
        if (typeof v == "bigint") return "\u6969" + v
        return v
    }))
    users.delete(id)
}
async function saveAllUsers() {
    await Promise.all(users.map((v, k) => saveUser(k)))
}
export default {
    getUser,
    saveUser,
    saveAllUsers,
    items,
    addMul
}