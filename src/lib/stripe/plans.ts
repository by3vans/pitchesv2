export const PLANS = {
    free: {
      name: 'Free',
      priceId: null,
      price: 0,
      limits: {
        pitches: 5,
        contacts: 20,
        templates: 2,
        reminders: 10,
      },
      features: [
        'Até 5 pitches',
        'Até 20 contatos',
        '2 templates de email',
        '10 lembretes',
        'Dashboard básico',
      ],
      cta: 'Começar grátis',
    },
  
    pro: {
      name: 'Pro',
      priceId: process.env.STRIPE_PRICE_PRO,
      price: 29,
      limits: {
        pitches: 100,
        contacts: 500,
        templates: 30,
        reminders: Infinity,
      },
      features: [
        'Até 100 pitches',
        'Até 500 contatos',
        '30 templates de email',
        'Lembretes ilimitados',
        'Analytics de pitches',
        'Exportar dados (CSV)',
        'Suporte prioritário',
      ],
      cta: 'Assinar Pro',
      highlighted: true,
    },
  
    business: {
      name: 'Business',
      priceId: process.env.STRIPE_PRICE_BUSINESS,
      price: 79,
      limits: {
        pitches: Infinity,
        contacts: Infinity,
        templates: Infinity,
        reminders: Infinity,
      },
      features: [
        'Pitches ilimitados',
        'Contatos ilimitados',
        'Templates ilimitados',
        'Analytics avançado',
        'Exportar + relatórios PDF',
        'Múltiplos usuários (em breve)',
        'Onboarding dedicado',
        'SLA de suporte',
      ],
      cta: 'Assinar Business',
    },
  } as const;
  
  export type Plan = keyof typeof PLANS;