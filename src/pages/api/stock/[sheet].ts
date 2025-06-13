import type { NextApiRequest, NextApiResponse } from "next";
const BASE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzem39PAWzjAIsRZg-m17LB_ufa6_qu3e20SqtYSAeCW7Vg6nk2ZqdgMVk3B_0mGBKJ/exec";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sheet } = req.query;
  if (typeof sheet !== "string")
    return res.status(400).json({ error: "sheet required" });
  const url = `${BASE_SCRIPT_URL}?sheet=${sheet}`;
  const opts: any = { headers: { "Content-Type": "application/json" } };
  if (req.method === "GET") {
    const apiRes = await fetch(url);
    const body = await apiRes.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(apiRes.status).send(body);
  }
  if (
    req.method === "PUT" ||
    req.method === "DELETE" ||
    req.method === "POST"
  ) {
    opts.method = req.method;
    opts.body = JSON.stringify(req.body);
    const apiRes = await fetch(url, opts);
    const body = await apiRes.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(apiRes.status).send(body);
  }
  res.setHeader("Allow", "GET,POST,PUT,DELETE");
  res.status(405).end();
}
