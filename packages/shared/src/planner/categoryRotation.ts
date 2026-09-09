export interface Category {
  id: string;
  name: string;
  url: string;
  lastUsed?: Date;
}

export const CATEGORIES: Category[] = [
  {
    id: 'maquinas-eletricas',
    name: 'Ferramentas Elétricas e Máquinas',
    url: 'https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas'
  },
  {
    id: 'ferramentas-manuais',
    name: 'Ferramentas Manuais',
    url: 'https://www.lojadomecanico.com.br/categorias/2/ferramentas-manuais-para-oficinas'
  },
  {
    id: 'automotivo',
    name: 'Ferramentas Automotivas',
    url: 'https://www.lojadomecanico.com.br/categorias/1/ferramentas-automotivas-especiais'
  },
  {
    id: 'solda',
    name: 'Soldas',
    url: 'https://www.lojadomecanico.com.br/categorias/98/maquinas-e-equipamentos-de-solda'
  },
  {
    id: 'hidraulica',
    name: 'Ferramentas Hidráulicas',
    url: 'https://www.lojadomecanico.com.br/categorias/22/ferramentas-para-lava-jato-e-posto'
  },
  {
    id: 'jardinagem',
    name: 'Jardinagem',
    url: 'https://www.lojadomecanico.com.br/categorias/33/ferramentas-para-jardinagem'
  },
  {
    id: 'organizacao',
    name: 'Organização',
    url: 'https://www.lojadomecanico.com.br/categorias/37/utilidades-diversas'
  },
  {
    id: 'construcao-civil',
    name: 'Construção Civil',
    url: 'https://www.lojadomecanico.com.br/categorias/31/ferramentas-para-construcao-civil'
  }
];

export class CategoryRotation {
  private lastUsedCategory: string | null = null;

  constructor() {
    // Carregar última categoria usada (poderia ser do localStorage ou arquivo)
    this.lastUsedCategory = this.loadLastUsedCategory();
  }

  /**
   * Escolhe categoria aleatória evitando repetir a última usada
   */
  chooseRandomCategory(): Category {
    const availableCategories = CATEGORIES.filter(
      cat => cat.id !== this.lastUsedCategory
    );

    if (availableCategories.length === 0) {
      // Se só tem uma categoria, retorna qualquer uma
      return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]!;
    }

    const selectedCategory = availableCategories[
      Math.floor(Math.random() * availableCategories.length)
    ]!;

    this.saveLastUsedCategory(selectedCategory.id);
    this.lastUsedCategory = selectedCategory.id;

    return selectedCategory;
  }

  /**
   * Escolhe categoria baseada em peso (mais variedade)
   */
  chooseWeightedCategory(): Category {
    // Implementação simples: categorias menos usadas têm mais peso
    const weights = CATEGORIES.map(cat => ({
      category: cat,
      weight: cat.id === this.lastUsedCategory ? 0 : 1
    }));

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { category, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        this.saveLastUsedCategory(category.id);
        this.lastUsedCategory = category.id;
        return category;
      }
    }

    // Fallback
    return this.chooseRandomCategory();
  }

  private loadLastUsedCategory(): string | null {
    try {
      // Simples: poderia usar localStorage, arquivo .json, ou Supabase
      return null; // Implementar conforme necessidade
    } catch {
      return null;
    }
  }

  private saveLastUsedCategory(categoryId: string): void {
    try {
      // Simples: salvar em localStorage, arquivo, ou Supabase
      console.log(`Categoria usada: ${categoryId}`);
    } catch {
      // Silenciosamente ignorar falha
    }
  }

  /**
   * Retorna estatísticas simples de uso
   */
  getStats(): { total: number; lastUsed: string | null } {
    return {
      total: CATEGORIES.length,
      lastUsed: this.lastUsedCategory
    };
  }
}
