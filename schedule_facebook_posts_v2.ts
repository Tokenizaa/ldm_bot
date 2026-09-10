#!/usr/bin/env tsx

import { chromium } from 'playwright';

const CONFIG = {
  groupUrl: 'https://www.facebook.com/groups/tokeniza',
  affiliateLink: 'https://www.lojadomecanico.com.br/produto/621944/98/1045/maquina-de-solda-inversora-multiprocesso-mig-0-sem-gas-120a-bivolt-com-mascara-de-solda-optiarc-70-boxer-99086/20889',
  postsPerDay: 5,
  totalDays: 30,
  timeSlots: [9, 11, 14, 17, 20], // Hours in 24h format
  startDate: new Date(), // Will start from tomorrow
  delayBetweenPosts: 8000, // 8 seconds
  delayAfterSchedule: 5000, // 5 seconds after clicking confirm
};

// Copy variations for posts
const POST_VARIATIONS = [
  '🔥 OFERTA RELÂMPAGO! Máquina de Solda Inversora Multiprocesso MIG 0 Sem Gás 120A Bivolt com Máscara de Solda Optiarc 70 - Perfeita para iniciantes e profissionais!',
  '⚡ PROMOÇÃO IMPERDÍVEL! Solda MIG sem gás 120A bivolt + máscara profissional. Qualidade BOXER-99086 pelo melhor preço!',
  '💥 LIQUIDAÇÃO RELÂMPAGO! Máquina de solda profissional com múltiplos processos. Aproveite enquanto dura o estoque!',
  '🎯 OFERTA DO DIA: Solda Inversora MIG 0 120A Bivolt + Máscara Optiarc 70. Ideal para oficina caseira e profissional.',
  '🚀 SUPER PROMOÇÃO! Máquina de solda versátil - funciona com diversos tipos de eletrodo e arame. Não perca!',
  '💰 ECONOMIZE AGORA! Solda MIG bivolt 120A com máscara incluida. Produto original BOXER-99086 com nota fiscal.',
  '🔧 OFERTA ESPECIAL PARA MECÂNICOS! Solda profissional para reparos automotivos, funilaria e serralharia.',
  '📦 KIT COMPLETO: Máquina de solda + máscara de proteção. Tudo que você precisa para começar a soldar hoje mesmo!',
  '⭐ AVALIAÇÃO 5 ESTRELAS! Clientes aprovam a qualidade e desempenho desta máquina de solda MIG profissional.',
  '🏆 MELHOR CUSTO-BENEFÍCIO! Solda inversora tecnologia avançada com display digital e controle preciso.',
];

async function schedulePost(page, postIndex) {
  try {
    // Calculate date and time for this post
    const dayIndex = Math.floor(postIndex / CONFIG.postsPerDay);
    const slotIndex = postIndex % CONFIG.postsPerDay;
    
    const postDate = new Date(CONFIG.startDate);
    postDate.setDate(postDate.getDate() + dayIndex + 1); // Start from tomorrow
    postDate.setHours(CONFIG.timeSlots[slotIndex], 0, 0, 0);
    
    // Format date/time for display and input
    const options = { timeZone: 'America/Sao_Paulo', hour12: false } as const;
    const dateTimeStr = postDate.toLocaleString('pt-BR', options); // dd/mm/yyyy HH:mm:ss
    const [datePart, timeWithSeconds] = dateTimeStr.split(' ');
    const timePart = timeWithSeconds.substring(0, 5); // HH:mm
    const displayStr = `${datePart} ${timePart}`;
    
    console.log(`\n📌 Post ${postIndex + 1}/150 - Dia ${dayIndex + 1}, Slot ${slotIndex + 1} - Agendado para: ${displayStr}`);
    
    // Ensure we are on the group page
    await page.goto(CONFIG.groupUrl, { waitUntil: 'networkidle', timeout: 20000 });
    console.log(`🔗 Current URL: ${page.url()}`);
    await page.waitForTimeout(2000);
    
    // DEBUG: Check if the text is present in the page
    const bodyText = await page.innerText('body');
    console.log(`📄 Body text length: ${bodyText.length}`);
    const hasWriteText = bodyText.includes('Escreva algo...');
    console.log(`🔍 Contains 'Escreva algo...'? ${hasWriteText}`);
    if (!hasWriteText) {
      console.log('🔍 First 200 chars of body:', bodyText.substring(0, 200));
    }
    
    // Also check for iframes
    const frames = page.frames();
    console.log(`🖼️ Number of frames: ${frames.length}`);
    for (let i = 0; i < Math.min(frames.length, 3); i++) {
      const frame = frames[i];
      try {
        const frameText = await frame.innerText('body');
        console.log(`   Frame ${i} URL: ${frame.url()}`);
        console.log(`   Frame ${i} contains 'Escreva algo...'? ${frameText.includes('Escreva algo...')}`);
      } catch (e) {
        console.log(`   Frame ${i} error: ${e.message}`);
      }
    }
    
    // If not found, try scrolling to load more content
    if (!hasWriteText) {
      console.log('⏳ Scrolling to load content...');
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
        const newBodyText = await page.innerText('body');
        if (newBodyText.includes('Escreva algo...')) {
          console.log('✅ Found after scrolling');
          break;
        }
      }
    }
    
    // Click "Escreva algo..." to open composer
    const writeBtn = page.getByText('Escreva algo...', { exact: true });
    await writeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await writeBtn.click();
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
    await page.click('text="Programar post"');
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
    await page.click('text="Programar"');
    await page.waitForTimeout(CONFIG.delayAfterSchedule);
    
    console.log(`✅ Post ${postIndex + 1} agendado com sucesso para ${displayStr}`);
    
  } catch (error) {
    console.error(`❌ Erro ao agendar post ${postIndex + 1}:`, error.message);
    // Save screenshot for debugging
    await page.screenshot({ path: `error-post-${postIndex + 1}.png` );
    throw error; // re-throw to stop if needed
  }
}

async function main() {
  console.log('🚀 Iniciando agendamento de posts para Facebook...');
  console.log(`📊 Total: ${CONFIG.totalDays} dias × ${CONFIG.postsPerDay} posts/dia = ${CONFIG.totalDays * CONFIG.postsPerDay} posts`);
  console.log(`🕐 Horários: ${CONFIG.timeSlots.map(h => `${h}:00`).join(', ')}`);
  console.log(`🔗 Link: ${CONFIG.affiliateLink}`);
  console.log('⏳ Aguarde...\n');
  
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  
  // Create a new page (tab)
  const page = await browser.newPage();
  // Set default timeout
  page.setDefaultTimeout(30000);
  
  try {
    for (let i = 0; i < CONFIG.totalDays * CONFIG.postsPerDay; i++) {
      await schedulePost(page, i);
      
      // Delay between posts (except after last)
      if (i < (CONFIG.totalDays * CONFIG.postsPerDay) - 1) {
        console.log(`⏳ Aguardando ${CONFIG.delayBetweenPosts / 1000}s antes do próximo post...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPosts));
      }
    }
    
    console.log('\n🎉 Todos os 150 posts foram agendados com sucesso!');
    console.log('📅 Verifique em: https://www.facebook.com/groups/tokeniza/scheduled_posts');
  } catch (error) {
    console.error('\n💥 Erro fatal durante o agendamento:', error);
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch(console.error);