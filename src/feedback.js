const tc = require("tough-cookie");
const wrap = require("axios-cookiejar-support");
const axios = require("axios");

module.exports = async (api, msg, content) => {
  const send = await api.sendMessage(
    msg.chat.id,
    "Sending Feedback, please don't delete this message",
  );
  const jar = new tc.CookieJar();
  const client = wrap.wrapper(
    axios.create({
      jar,
      withCredentials: true,
    }),
  );

  await client.get(`${env.API_BACKEND}/set-cookie`);

  const { data } = await client.post(`${env.API_BACKEND}/feedback/submit`, {
    application: "Amogus Bot [Music Bot]",
    message: content,
    userId: msg.chat.id,
  });

  if (data) {
    await api.editMessageText(msg, {
      chat_id: res.chat.id,
      message_id: res.message_id,
    });
    await api.editMessageText(
      "Thank you for your feedback. If ever you encounter some error, please let us know.",
      {
        chat_id: res.chat.id,
        message_id: res.message_id,
      },
    );

    setTimeout(() => {
      api.deleteMessage(res.chat.id, res.message_id);
    }, 5000);
  }
};
