#!/usr/bin/env tsx

import { chromium } from 'playwright';

const CONFIG = {
  groupUrl: 'https://www.facebook.com/groups/tokeniza',
  affiliateLink: 'https://www.lojadomecanico.com.br/produto/621944/98/1045/maquina-de-solda-inversora-multiprocesso-mig-0-sem-gas-120a-bivolt-com-mascara-de-solda-optiarc-70-boxer-99086/20889',
  // For demo, schedule 3 posts in the next few hours
  demoPosts: 3,
  startDate: new Date(), // Start from now
  delayBetweenPosts: 5000, // 5 seconds between posts
  delayAfterSchedule: 3000, // 3 seconds after clicking confirm
};

// Copy variations for posts
const POST_VARIATIONS = [
  '🔥 DEMONSTRAÇÃO: Máquina de Solda Inversora Multiprocesso MIG 0 Sem Gás 120A Bivolt com Máscara de Solda Optiarc 70 - Perfeita para iniciantes e profissionais!',
  '⚡ DEMO: Solda MIG sem gás 120A bivolt + máscara profissional. Qualidade BOXER-99086 pelo melhor preço!',
  '💥 DEMO: Máquina de solda profissional com múltiplos processos. Aproveite enquanto dura o estoque!',
];

async function scheduleDemoPost(page, postIndex) {
  // Schedule posts at 10, 20, 30 minutes from now for demo
  const minutesOffset = (postIndex + 1) * 10;
  const postDate = new Date(CONFIG.startDate.getTime() + minutesOffset * 60 * 1000);
  
  // Format date/time for display and input
  const options = { timeZone: 'America/Sao_Paulo', hour12: false } as const;
  const dateTimeStr = postDate.toLocaleString('pt-BR', options); // dd/mm/yyyy HH:mm:ss
  const [datePart, timeWithSeconds] = dateTimeStr.split(' ');
  const timePart = timeWithSeconds.substring(0, 5); // HH:mm
  const displayStr = `${datePart} ${timePart}`;
  
  console.log(`\n📌 Demo Post ${postIndex + 1}/3 - Agendado para: ${displayStr}`);
  
  // Ensure we are on the group timeline
  await page.goto(CONFIG.groupUrl, { waitUntil: 'networkidle', timeout: 20000 });
  // Wait a bit for feed to load
  await page.waitForTimeout(2000);
  
  // Click "Escreva algo..." to open composer
  await page.getByRole('button', { name: 'Escreva algo...' }).click();
  await page.waitForTimeout(1000);
  
  // Fill post content
  const contentBox = page.getByRole('textbox', { name: 'Crie um post público…' });
  await contentBox.click();
  await page.waitForTimeout(500);
  
  const variationIndex = postIndex % POST_VARIATIONS.length;
  const baseContent = POST_VARIATIONS[variationIndex];
  const contentWithLink = `${baseContent}\n\n${CONFIG.affiliateLink}`;
  await contentBox.fill(contentWithLink);
  await page.waitForTimeout(500);
  
  // Add @todos mention
  await contentBox.press(' ');
  await page.keyboard.type('@todos');
  await page.waitForTimeout(500);
  
  // Press Enter to select the first suggestion (@todos)
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // Wait for link preview to load
  await page.waitForTimeout(3000);
  
  // Click "Programar post"
  await page.getByRole('button', { name: 'Programar post' }).click();
  await page.waitForTimeout(1000);
  
  // Set date - click on the date input
  const dateInput = page.getByRole('textbox', { name: /Comece a digitar a data/ });
  await dateInput.click();
  await page.waitForTimeout(500);
  
  // Fill date as DD/MM/YYYY
  await dateInput.fill(datePart);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // Set time
  const timeInput = page.getByRole('textbox', { name: /Comece a digitar o horário/ });
  await timeInput.click();
  await page.waitForTimeout(500);
  
  // Fill time as HH:MM
  await timeInput.fill(timePart);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // Click the confirmation button
  await page.getByRole('button', { name: /Programar|Confirmar/ }).first().click();
  await page.waitForTimeout(CONFIG.delayAfterSchedule);
  
  console.log(`✅ Demo Post ${postIndex + 1} agendado com sucesso para ${displayStr}`);
}

async function main() {
  console.log('🚀 Iniciando agendamento de demonstração (3 posts)...');
  console.log(`🔗 Link: ${CONFIG.affiliateLink}`);
  console.log('⏳ Aguarde...\n');
  
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  
  // Create a new page (tab)
  const page = await browser.newPage();
  // Set default timeout
  page.setDefaultTimeout(30000);
  
  try {
    for (let i = 0; i < CONFIG.demoPosts; i++) {
      await scheduleDemoPost(page, i);
      
      // Delay between posts (except after last)
      if (i < CONFIG.demoPosts - 1) {
        console.log(`⏳ Aguardando ${CONFIG.delayBetweenPosts / 1000}s antes do próximo post...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPosts));
      }
    }
    
    console.log('\n🎉 Demonstração concluída! 3 posts agendados com sucesso.');
    console.log('📅 Verifique em: https://www.facebook.com/groups/tokeniza/scheduled_posts');
  } catch (error) {
    console.error('\n💥 Erro durante a demonstração:', error);
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch(console.error);