import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import TelegramBot, { Message } from "node-telegram-bot-api";
import { CookieJar } from "tough-cookie";

export default async function feedback(api: TelegramBot, event: Message, body: string) {
  const send = await api.sendMessage(event.chat.id, "Sending feedback, please don't delete this message")

  const jar = new CookieJar()
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true
    }))

  await client.get(`${process.env.API_BACKEND}/set-cookie`)

  const { data } = await client.post(`${process.env.API_BACKEND}/feedback/submit`, {
    application: "Amogus Bot",
    message: body,
    userId: event.chat.id
  })

  if (data) {
    await api.editMessageText("Thank you for your feedback. If ever you encountered some error, please let us know", {
      chat_id: send.chat.id,
      message_id: send.message_id
    })
  }

  setTimeout(() => {
    api.deleteMessage(send.chat.id, send.message_id)
  }, 5000)
}
