import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const response = await fetch("https://script.google.com/macros/s/AKfycbw5KxMn7OLci-nZ2WhYNObGKlyHexKj23nrsqC0uUm3QEtLZfcC33Qpye7atnGPQbzC/exec", {
      method: "POST",
      body: JSON.stringify(req.body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    res.status(200).json(result);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
