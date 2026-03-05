'use client';

import { useSubscription } from './useSubscription';

export function useFeatureGate() {
  const { plan, limits, usage } = useSubscription();

  const remaining = {
    pitches:   limits.pitches === Infinity ? Infinity : Math.max(0, limits.pitches - usage.pitches),
    contacts:  limits.contacts === Infinity ? Infinity : Math.max(0, limits.contacts - usage.contacts),
    templates: limits.templates === Infinity ? Infinity : Math.max(0, limits.templates - usage.templates),
    reminders: limits.reminders === Infinity ? Infinity : Math.max(0, limits.reminders - usage.reminders),
  };

  const usagePercent = {
    pitches:   limits.pitches === Infinity ? 0 : Math.round((usage.pitches / limits.pitches) * 100),
    contacts:  limits.contacts === Infinity ? 0 : Math.round((usage.contacts / limits.contacts) * 100),
    templates: limits.templates === Infinity ? 0 : Math.round((usage.templates / limits.templates) * 100),
    reminders: limits.reminders === Infinity ? 0 : Math.round((usage.reminders / limits.reminders) * 100),
  };

  return {
    // Pode criar?
    canCreatePitch:    usage.pitches < limits.pitches,
    canCreateContact:  usage.contacts < limits.contacts,
    canCreateTemplate: usage.templates < limits.templates,
    canCreateReminder: usage.reminders < limits.reminders,

    // Features por plano
    canExportCSV:       plan !== 'free',
    canExportPDF:       plan === 'business',
    canAccessAnalytics: plan !== 'free',

    // Quanto sobrou
    remaining,

    // Percentual de uso (para barras de progresso)
    usagePercent,
  };
}