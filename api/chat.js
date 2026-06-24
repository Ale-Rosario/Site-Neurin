

// ============================================================
//  Neurin · Função de atendimento com IA (Vercel Serverless)
//  Caminho no projeto:  /api/chat.js
//
//  Mantém a sua chave da API protegida no servidor (nunca no
//  navegador). O site chama "/api/chat" e esta função repassa
//  para a Anthropic com a chave guardada em variável de ambiente.
//
//  PASSOS:
//  1) Coloque este arquivo em  api/chat.js  no seu projeto Vercel.
//  2) No painel da Vercel:  Settings → Environment Variables
//     crie:  ANTHROPIC_API_KEY = sua-chave-aqui
//  3) No site (neurin-site-ia.html), troque a linha:
//        const ENDPOINT = "https://api.anthropic.com/v1/messages";
//     por:
//        const ENDPOINT = "/api/chat";
//  4) Faça o deploy. Pronto: a Nina responde direto do seu domínio.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-sonnet-4-6",
        max_tokens: body.max_tokens || 1000,
        system: body.system,
        messages: body.messages || [],
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Falha ao processar a solicitação" });
  }
}
