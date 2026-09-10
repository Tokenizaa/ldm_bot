import type { AffiliateLink } from '@forge-deals/shared/types';
import { ProductScorer } from '@forge-deals/shared/planner/productScore';
import { AntiRepetition } from '@forge-deals/shared/planner/antiRepetition';
import { CategoryRotation } from '@forge-deals/shared/planner/categoryRotation';
import { affiliateLinkService } from '../../../workers/src/services/affiliateLinkService.js';

interface ProductForScoring {
  id: string;
  title: string;
  price: number;
  old_price: number;
  image: string;
  affiliate_url: string;
  category: string;
  brand: string;
  description?: string;
  technical_specs?: string;
}

interface ScoredProduct extends ProductForScoring {
  score: number;
  scoreReasons: string[];
}

interface ScheduleResultItem {
  datetime: Date;
  product: AffiliateLink;
  copy: string;
  status: 'pending' | 'scheduled' | 'failed';
  error?: string;
  postId?: string;
}

interface DryRunResult {
  success: boolean;
  schedule: ScheduleResultItem[];
  totalSlots: number;
  productsUsed: number;
  warnings: string[];
}

interface BuildPostDraftResult {
  text: string;
  link: string;
}

export class SocialSchedulerService {
  private scorer = new ProductScorer();
  private antiRepetition = new AntiRepetition();
  private categoryRotation = new CategoryRotation();

  private readonly POSTS_PER_DAY = 5;
  private readonly SLOT_HOURS = [9, 11, 14, 17, 20];
  private readonly AFFILIATE_ID_SUFFIX = '/20889';

  async generateSchedule(
    days: number = 30,
    postsPerDay: number = this.POSTS_PER_DAY,
    slots: number[] = this.SLOT_HOURS,
    startFrom: 'today' | 'tomorrow' = 'tomorrow',
  ): Promise<Date[]> {
    const scheduleSlots: Date[] = [];
    const now = new Date();
    const startDate = new Date(now);
    const offset = startFrom === 'today' ? 0 : 1;
    startDate.setDate(startDate.getDate() + offset);
    startDate.setHours(0, 0, 0, 0);

    const hoursToUse = slots.slice(0, Math.min(postsPerDay, slots.length));

    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      for (const hour of hoursToUse) {
        const slot = new Date(currentDate);
        slot.setHours(hour, 0, 0, 0);
        scheduleSlots.push(slot);
      }
    }

    return scheduleSlots;
  }

  async getAvailableProducts(): Promise<AffiliateLink[]> {
    return affiliateLinkService.getAllMonitored?.() ?? [];
  }

  async selectProductsForSchedule(
    slotsCount: number,
    availableProducts: AffiliateLink[],
  ): Promise<AffiliateLink[]> {
    if (availableProducts.length === 0) return [];

    const productsForScoring: ProductForScoring[] = availableProducts.map((p) => ({
      id: p.id,
      title: p.product_name,
      price: p.current_price,
      old_price: p.previous_price,
      image: '',
      affiliate_url: p.affiliate_url,
      category: p.category,
      brand: p.brand,
      description: '',
      technical_specs: '',
    }));

    const recentCategories: string[] = [];
    const recentBrands: string[] = [];

    const scoredProducts: ScoredProduct[] = productsForScoring.map((product) =>
      this.scorer.calculateScore(product, recentCategories, recentBrands),
    );

    const minScore = 20;
    const filteredProducts = scoredProducts.filter((p) => p.score >= minScore);

    const availableForPosting = this.antiRepetition.filterAvailableProducts(
      filteredProducts.map((p) => ({ id: p.id, categoryId: p.category })),
    ) as unknown as ScoredProduct[];

    const sortedProducts = this.scorer.sortByScore(availableForPosting);

    const selected: AffiliateLink[] = [];
    let cycle = 0;

    while (selected.length < slotsCount && sortedProducts.length > 0) {
      for (const scored of sortedProducts) {
        if (selected.length >= slotsCount) break;

        const originalProduct = availableProducts.find((p) => p.id === scored.id);
        if (originalProduct) {
          (originalProduct as any)._scheduleCycle = cycle;
          selected.push(originalProduct);
        }
      }
      cycle++;
      if (cycle > 10) break;
    }

    if (selected.length < slotsCount) {
      console.warn(`[Scheduler] Apenas ${selected.length} produtos para ${slotsCount} slots — repetindo com score menor`);
    }

    return selected.slice(0, slotsCount);
  }

  buildPostDraft(product: AffiliateLink, slotIndex: number): BuildPostDraftResult {
    const hasPriceDrop = product.previous_price && product.previous_price > product.current_price;
    const discountPercent = hasPriceDrop
      ? Math.round(((product.previous_price - product.current_price) / product.previous_price) * 100)
      : 0;

    let affiliateUrl = product.affiliate_url;
    if (!affiliateUrl.includes(this.AFFILIATE_ID_SUFFIX)) {
      const baseUrl = affiliateUrl.split('?')[0] ?? affiliateUrl;
      if (!baseUrl.endsWith(this.AFFILIATE_ID_SUFFIX)) {
        affiliateUrl = `${baseUrl}${this.AFFILIATE_ID_SUFFIX}`;
      }
    }

    const openings = [
      'Essa',
      'A',
      'Olha só essa',
      'Encontrei essa',
      'Vale dar uma olhada nessa',
    ];
    const opening = openings[slotIndex % openings.length];

    let context = `${opening} ${product.product_name}`;
    if (hasPriceDrop) {
      context += ` apareceu com ${discountPercent}% de desconto (era R$ ${product.previous_price.toFixed(2)}, agora R$ ${product.current_price.toFixed(2)})`;
    } else {
      context += ` está por R$ ${product.current_price.toFixed(2)}`;
    }

    const utilities = [
      'Pra quem precisa de uma ferramenta confiável no dia a dia.',
      'Boa opção pra quem tá montando ou renovando o kit.',
      'Custo-benefício que faz sentido pra oficina.',
      'Pra quem não quer gastar em marca premium mas precisa de qualidade.',
      'Útil tanto pra uso profissional quanto pra manutenção em casa.',
    ];
    const utility = utilities[slotIndex % utilities.length];

    const ctas = [
      'Quem quiser conferir: ',
      'Link pra dar uma olhada: ',
      'Disponível aqui: ',
      'Vale conferir: ',
      'Pra quem tiver interesse: ',
    ];
    const cta = ctas[slotIndex % ctas.length];

    const text = `${context}\n\n${utility}\n\n${cta}`;
    const link = affiliateUrl;

    return { text, link };
  }

  async generateDryRun(
    days: number = 30,
    postsPerDay: number = 5,
  ): Promise<DryRunResult> {
    const warnings: string[] = [];

    const slots = await this.generateSchedule(days, postsPerDay);
    const totalSlots = slots.length;

    const availableProducts = await this.getAvailableProducts();
    if (availableProducts.length === 0) {
      warnings.push('Nenhum produto monitorado encontrado no banco');
      return { success: true, schedule: [], totalSlots: 0, productsUsed: 0, warnings };
    }

    const selectedProducts = await this.selectProductsForSchedule(totalSlots, availableProducts);
    const productsUsed = selectedProducts.length;

    if (productsUsed < totalSlots) {
      warnings.push(
        `Apenas ${productsUsed} produtos disponíveis para ${totalSlots} slots — alguns horários ficarão vazios`,
      );
    }

    const schedule: ScheduleResultItem[] = [];
    for (let i = 0; i < Math.min(totalSlots, productsUsed); i++) {
      const product = selectedProducts[i];
      const slotDate = slots[i];
      if (!product || !slotDate) continue;
      const { text, link } = this.buildPostDraft(product, i);
      schedule.push({
        datetime: slotDate,
        product,
        copy: `${text}\n\n${link}\n\n@todos`,
        status: 'pending',
      });
    }

    return {
      success: true,
      schedule,
      totalSlots,
      productsUsed,
      warnings,
    };
  }

  async executeSchedule(
    schedule: ScheduleResultItem[],
    groupId: string,
    publisher: { schedulePost: (content: { text: string; link?: string; imageUrl?: string }, groupId: string, scheduledAt: Date) => Promise<any> },
    delayBetweenPostsMs: number = 10000,
  ): Promise<ScheduleResultItem[]> {
    const results: ScheduleResultItem[] = [];

    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      if (!item) continue;
      console.log(`[Scheduler] Agendando ${i + 1}/${schedule.length}: ${item.datetime.toISOString()}`);

      const { text, link } = this.buildPostDraft(item.product, i);

      try {
        const result = await publisher.schedulePost(
          { text, link },
          groupId,
          item.datetime,
        );

        if (result.success) {
          item.status = 'scheduled';
          item.postId = result.postId;
          console.log(`[Scheduler] ✓ Agendado: ${item.postId}`);
        } else {
          item.status = 'failed';
          item.error = result.error;
          console.error(`[Scheduler] ✗ Falhou: ${result.error}`);
        }
      } catch (error) {
        item.status = 'failed';
        item.error = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[Scheduler] ✗ Exceção: ${item.error}`);
      }

      if (i < schedule.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenPostsMs));
      }

      results.push(item);
    }

    return results;
  }
}

export const socialSchedulerService = new SocialSchedulerService();