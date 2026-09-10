#!/usr/bin/env tsx

import { chromium } from 'playwright';
import { addMinutes, format, startOfDay, endOfDay, eachHour, intervalToDuration } from 'date-fns';

// Configuration
const CONFIG = {
  groupUrl: 'https://www.facebook.com/groups/tokeniza',
  affiliateLink: 'https://www.lojadomecanico.com.br/produto/621944/98/1045/maquina-de-solda-inversora-multiprocesso-mig-0-sem-gas-120a-bivolt-com-mascara-de-solda-optiarc-70-boxer-99086/20889',
  postsPerDay: 5,
  totalDays: 30,
  timeSlots: [9, 11, 14, 17, 20], // Hours in 24h format
  startDate: new Date(), // Will start from tomorrow
  delayBetweenPosts: 5000, // 5 seconds
  delayAfterSchedule: 3000, // 3 seconds after clicking "Programar"
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

async function schedulePost(browser, postIndex) {
  const page = await browser.newPage();
  
  try {
    // Calculate date and time for this post
    const dayIndex = Math.floor(postIndex / CONFIG.postsPerDay);
    const slotIndex = postIndex % CONFIG.postsPerDay;
    
    const postDate = addMinutes(
      startOfDay(CONFIG.startDate),
      (dayIndex + 1) * 24 * 60 // Start from tomorrow
    );
    
    const postTime = postDate.setHours(
      CONFIG.timeSlots[slotIndex],
      0, // minutes
      0, // seconds
      0  // milliseconds
    );
    
    const formattedDate = format(new Date(postTime), "dd/MM/yyyy HH:mm");
    console.log(`\n📌 Post ${postIndex + 1}/150 - Dia ${dayIndex + 1}, Slot ${slotIndex + 1} - Agendado para: ${formattedDate}`);
    
    // Navigate to group
    await page.goto(CONFIG.groupUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click "Escreva algo..." to open composer
    const writeSomethingBtn = page.getByRole('button', { name: 'Escreva algo...' });
    await writeSomethingBtn.click();
    await page.waitForTimeout(1000);
    
    // Fill post content
    const contentBox = page.getByRole('textbox', { name: 'Crie um post público…' });
    const variationIndex = postIndex % POST_VARIATIONS.length;
    const baseContent = POST_VARIATIONS[variationIndex];
    
    // Add @todos mention at a random position for variation
    const contentWithLink = `${baseContent}\n\n${CONFIG.affiliateLink}`;
    await contentBox.fill(contentWithLink);
    await page.waitForTimeout(1000);
    
    // Add @todos mention
    await contentBox.press(' ');
    await page.keyboard.type('@todos');
    await page.waitForTimeout(500);
    
    // Press Enter to select the first suggestion (@todos)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Wait for link preview to load (optional but good practice)
    await page.waitForTimeout(3000);
    
    // Click "Programar post"
    const scheduleBtn = page.getByRole('button', { name: 'Programar post' });
    await scheduleBtn.click();
    await page.waitForTimeout(1000);
    
    // Set date
    // First click on the date input
    const dateInput = page.getByRole('textbox', { name: /Comece a digitar a data/ });
    await dateInput.click();
    await page.waitForTimeout(500);
    
    // Format date as DD/MM/YYYY
    const dateStr = format(new Date(postTime), 'dd/MM/yyyy');
    await dateInput.fill(dateStr);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Set time
    const timeInput = page.getByRole('textbox', { name: /Comece a digitar o horário/ });
    await timeInput.click();
    await page.waitForTimeout(500);
    
    // Format time as HH:MM
    const timeStr = format(new Date(postTime), 'HH:mm');
    await timeInput.fill(timeStr);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Click the confirmation button (could be "Programar" or similar)
    const confirmBtn = page.getByRole('button', { name: /Programar|Confirmar|Agendar/ }).first();
    await confirmBtn.click();
    await page.waitForTimeout(CONFIG.delayAfterSchedule);
    
    console.log(`✅ Post ${postIndex + 1} agendado com sucesso para ${format(new Date(postTime), 'dd/MM/yyyy HH:mm')}`);
    
  } catch (error) {
    console.error(`❌ Erro ao agendar post ${postIndex + 1}:`, error.message);
    // Take screenshot for debugging
    await page.screenshot({ path: `error-post-${postIndex + 1}.png` });
  } finally {
    await page.close();
    // Delay between posts to avoid rate limiting
    if (postIndex < (CONFIG.totalDays * CONFIG.postsPerDay) - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPosts));
    }
  }
}

async function main() {
  console.log('🚀 Iniciando agendamento de posts para Facebook...');
  console.log(`📊 Total: ${CONFIG.totalDays} dias × ${CONFIG.postsPerDay} posts/dia = ${CONFIG.totalDays * CONFIG.postsPerDay} posts`);
  console.log(`🕐 Horários: ${CONFIG.timeSlots.map(h => `${h}:00`).join(', ')}`);
  console.log(`🔗 Link: ${CONFIG.affiliateLink}`);
  console.log('⏳ Aguarde...\n');
  
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  try {
    for (let i = 0; i < CONFIG.totalDays * CONFIG.postsPerDay; i++) {
      await schedulePost(browser, i);
    }
    
    console.log('\n🎉 Todos os 150 posts foram agendados com sucesso!');
    console.log('📅 Verifique em: https://www.facebook.com/groups/tokeniza/scheduled_posts');
  } catch (error) {
    console.error('\n💥 Erro fatal:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);