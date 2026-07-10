import axios from "axios";
import TelegramBot, { Message } from "node-telegram-bot-api";

async function editMessage(api: TelegramBot, event: Message, message: string) {
  const res = await api.editMessageText(message, {
    chat_id: event.chat.id,
    message_id: event.message_id
  }) as Message
  return res
}

export default async function music(api: TelegramBot, event: Message, body: string) {
  const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/

  const message = await api.sendMessage(event.chat.id, `Searching for the ${ytRegex.test(body) ? "Youtube ID" : "song"} ${body}`)

  if (!ytRegex.test(body)) {
    const ytSearch = await axios.get(`https://yt-dlp-stream.onrender.com/api/v3/q?=${encodeURIComponent(body)}`)
      .then(res => {
        return res.data.results[0].video_id
      }).catch(e => {
        console.error(e)
        return body
      })

    body = ytSearch

  } else {
    body = body.match(ytRegex)?.[1] ?? body
  }

  const { data } = await axios.get(`${process.env.API_BACKEND}/yt?videoID=${encodeURIComponent(body)}`)

  if (data.error) {
    await editMessage(api, message, `ERR [${body}]: An error occured`) as Message
    try {
      api.deleteMessage(message.chat.id, message.message_id)
    } catch (e) { }
  }

  await editMessage(api, message, `Processing`) as Message

  api.sendAudio(event.chat.id, data.url, {}, {}).then((_) => {
    try {
      api.deleteMessage(message.chat.id, message.message_id)
    } catch (e) { };
  });

}
