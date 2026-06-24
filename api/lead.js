// ============================================================
//  Neurin · Envio de leads por e-mail (Vercel Serverless)
//  Caminho no projeto:  /api/lead.js
//
//  Recebe o lead capturado pela Neu (nome, contato, resumo e a
//  conversa) e te envia por e-mail automaticamente, usando o
//  Resend (https://resend.com) — sem instalar pacotes.
//
//  COMO CONFIGURAR (uma vez):
//  1) Crie uma conta grátis em resend.com usando o SEU e-mail
//     alessandra.rosario@neurin.ai (importante: use esse e-mail,
//     pois os leads chegam nele no modo inicial).
//  2) No painel do Resend, vá em "API Keys" e crie uma chave.
//  3) Na Vercel:  Settings → Environment Variables  → crie:
//        RESEND_API_KEY = a-chave-que-voce-copiou
//     (opcional) LEAD_TO_EMAIL = e-mail que recebe os leads
//                                (padrão: alessandra.rosario@neurin.ai)
//  4) Coloque este arquivo em  api/lead.js  e faça o deploy.
//
//  OBS: no início, o remetente é onboarding@resend.dev e o Resend
//  só entrega para o e-mail da sua conta. Quando quiser enviar de
//  leads@neurin.ai (e para outros e-mails), verifique o domínio
//  neurin.ai no Resend e defina LEAD_FROM_EMAIL.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "RESEND_API_KEY não configurada" });
  }

  const to = process.env.LEAD_TO_EMAIL || "alessandra.rosario@neurin.ai";
  const from = process.env.LEAD_FROM_EMAIL || "Neurin Leads <onboarding@resend.dev>";

  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const nome = String(b.nome || "—").slice(0, 120);
    const contato = String(b.contato || "—").slice(0, 160);
    const resumo = String(b.resumo || "—").slice(0, 1200);
    const transcript = String(b.transcript || "").slice(0, 7000);
    const url = String(b.url || "").slice(0, 300);
    const when = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const isEmail = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/.test(contato.trim());

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0B1A2A;max-width:620px">
        <h2 style="color:#00A383;margin:0 0 14px">Novo lead pelo site da Neurin</h2>
        <p style="margin:4px 0"><b>Nome:</b> ${esc(nome)}</p>
        <p style="margin:4px 0"><b>Contato:</b> ${esc(contato)}</p>
        <p style="margin:4px 0"><b>Resumo:</b> ${esc(resumo)}</p>
        <p style="margin:10px 0 0;color:#5C6672;font-size:13px"><b>Quando:</b> ${esc(when)} &nbsp;•&nbsp; <b>Página:</b> ${esc(url)}</p>
        <hr style="border:none;border-top:1px solid #e2e8e6;margin:18px 0">
        <p style="font-size:13px;color:#5C6672;margin:0 0 8px"><b>Conversa com a Neu</b></p>
        <pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.5;background:#f4f7f6;padding:14px;border-radius:8px;margin:0">${esc(transcript)}</pre>
      </div>`;

    const payload = {
      from,
      to,
      subject: `Novo lead: ${nome}`,
      html,
    };
    if (isEmail) payload.reply_to = contato.trim();

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: "Falha no envio do e-mail", detail: data });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao processar o lead" });
  }
}
