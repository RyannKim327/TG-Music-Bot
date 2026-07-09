import TelegramBot, { Message } from "node-telegram-bot-api";
import * as dotenv from "dotenv"
import log from "./utils/console";
import express, { Express, Request, Response } from "express"
import { existsSync, mkdirSync, rm } from "fs";
import core from "./core";

function main() {
  dotenv.config()

  const token = process.env.TELEGRAM_TOKEN
  const url = process.env.WEBHOOK_URL

  if (!token) {
    return log("Index", "Token is missing", "e")
  }

  log(
    "Starter",
    `
        ╭―――――――――――――――――――――――――――――――――――――――――╮
        │                                         │
        │      Welcome to Telegram Music Bot      │
        │     Developed by Ryann Kim Sesgundo     │
        │                                         │
        ╰―――――――――――――――――――――――――――――――――――――――――╯`,
  );
  const directory = `${__dirname}/temp`;

  try {
    let api: TelegramBot | null = null

    if (url) {
      // TODO: Webhook setup
      api = new TelegramBot(token)
      const app: Express = express()
      app.use(express.json())

      app.get("/", (req: Request, res: Response) => {
        res.send("Currently working")
      })

      api.setWebhook(`${url}/bot${token}`)

      app.post(`/bot${token}`, (req: Request, res: Response) => {
        api?.processUpdate(req.body)
        res.sendStatus(200)
      })

      app.listen(process.env.PORT || 3000, () => {
        log("Server Initiator", "Server starter using Webhook")
        log("Server Initiator", "Developed by MPOP Reverse II")
      })

    } else {
      // TODO: Polling Setup
      api = new TelegramBot(token, {
        polling: true
      })
      log("Server Initiator", "Server starter using polling")
      log("Server Initiator", "Developed by MPOP Reverse II")
    }

    if (existsSync(directory)) {
      rm(directory, {
        recursive: true
      }, (e) => { })
    }

    setTimeout(() => {
      mkdirSync(directory)
    }, 1500)

    log("Welcome", "Server Loaded and Running")

    api.onText(/([\w\W]+)/gi, (message: Message, regex: RegExpExecArray | null) => {
      core(api, message, regex)
    })

  } catch (e) {
    log("Main Catch", e.toString(), "e")
  }

}

main()
