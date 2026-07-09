import TelegramBot, { Message } from "node-telegram-bot-api";
import music from "./scripts/music";

export default function core(api: TelegramBot, event: Message, regex: RegExpExecArray | null) {
  console.log(regex)
  if (regex !== null) {
    let body = regex[0]
    if (body.startsWith("/start")) {
      // TODO: Welcomer
      api.sendMessage(event.chat.id, "Greetings, I am ඞ, your telegram bot music (based on youtube music). If you want to get started, kindly message back your music you want to look for its either title or link. If you want to grab a music easily from Youtube, you may click on share from youtube, look for telegram or telegram x and look for my profile.\n\nThis message will automatically deleted after 2 minutes.\n\n- Developed by MPOP Reverse II")
        .then((r: Message) => {
          setTimeout(() => {
            api.deleteMessage(r.chat.id, r.message_id)
          }, 120000)
        }).catch(e => { })
    } else if (body.startsWith("/delete")) {
      if (event.reply_to_message) {
        api.deleteMessage(event.reply_to_message.chat.id, event.reply_to_message.message_id)
        api.deleteMessage(event.chat.id, event.message_id)
      }
    } else {
      if (body.startsWith("/music ") || event.chat.type === "private") {
        if (body.startsWith("/")) {
          let split = body.split(" ")
          split.shift()
          body = split.join(" ")
        }
        music(api, event, body)
      }
    }
    api.deleteMessage(event.chat.id, event.message_id)
  }
}

