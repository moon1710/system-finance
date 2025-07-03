//Prueba de mailgun, no se utilizó por falta de dominio

import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0

async function sendSimpleMessage() {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key:
      process.env.API_KEY ||
      "9274de1134f966a7349c43329602e408-6d5bd527-982f3f57",
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });
  try {
    const data = await mg.messages.create(
      "sandbox36f3626898f6415dae03626e87022d62.mailgun.org",
      {
        from: "Mailgun Sandbox <postmaster@sandbox36f3626898f6415dae03626e87022d62.mailgun.org>",
        to: ["Monserrat Lopez Caballero <moon.loca17@gmail.com>"],
        subject: "Hello Monserrat Lopez Caballero",
        text: "Congratulations Monserrat Lopez Caballero, you just sent an email with Mailgun! You are truly awesome!",
      }
    );

    console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
}

// 👇 Llama la función directamente así
sendSimpleMessage();