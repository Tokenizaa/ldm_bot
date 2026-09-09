const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-4-maverick-17b-128e-instruct';

export interface ProductCopyInput {
  productName: string;
  brand?: string | null;
  category?: string | null;
}

function containsPrice(text: string): boolean {
  return /(r\$|brl|\$\s*\d|\d+[,.]\d{2}\s*(reais)?)/i.test(text);
}

function sanitizeCopy(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^(texto|copy|post)\s*:\s*/i, '')
    .trim();
}

export async function generateProductCopy(product: ProductCopyInput): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY não configurada');

  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const prompt = [
    'Crie uma publicação curta e natural para um grupo do Facebook de ferramentas e oficina.',
    'Objetivo: apresentar um produto real, com contexto de uso e benefício.',
    'Use produto + característica/conhecimento disponível + aplicação/benefício.',
    'Não faça keyword stuffing.',
    'Inclua de 3 a 5 hashtags relevantes.',
    'NÃO inclua preço, desconto, porcentagem, moeda ou valor numérico comercial.',
    'NÃO invente especificações que não foram fornecidas.',
    'NÃO inclua link nem @everyone; eles serão adicionados pela aplicação.',
    '',
    `Produto: ${product.productName}`,
    `Marca: ${product.brand || 'não informada'}`,
    `Categoria: ${product.category || 'não informada'}`
  ].join('\n');

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Você é um copywriter de comércio eletrônico. Responda somente com o texto final da publicação.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.75,
      max_tokens: 220
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`NVIDIA HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const copy = sanitizeCopy(payload.choices?.[0]?.message?.content || '');

  if (!copy) throw new Error('NVIDIA retornou copy vazio');
  if (containsPrice(copy)) throw new Error('Copy rejeitado: contém preço/valor comercial');

  return copy;
}
