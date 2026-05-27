import { describe, it, expect } from 'vitest';
import {
  dateToISOWeek,
  isoWeekToDate,
  isFutureWeek,
  getCurrentISOWeek,
  generateWeeksScale,
  formatWeekLabel,
  groupWeeksByMonth,
} from './isoWeek';

describe('dateToISOWeek', () => {
  it('converte 2025-01-01 (quarta) para 2025-W01', () => {
    expect(dateToISOWeek(new Date(2025, 0, 1))).toBe('2025-W01');
  });
  it('converte 2024-12-30 (segunda) para 2025-W01 (virada de ano ISO)', () => {
    expect(dateToISOWeek(new Date(2024, 11, 30))).toBe('2025-W01');
  });
  it('converte 2025-12-28 (domingo) para 2025-W52', () => {
    expect(dateToISOWeek(new Date(2025, 11, 28))).toBe('2025-W52');
  });
  it('retorna string no formato YYYY-Www', () => {
    const result = dateToISOWeek(new Date(2025, 5, 15));
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('isoWeekToDate', () => {
  it('2025-W01 → segunda-feira 2024-12-30', () => {
    const d = isoWeekToDate('2025-W01');
    expect(d.getDay()).toBe(1); // Monday
    expect(d.toISOString().slice(0, 10)).toBe('2024-12-30');
  });
  it('2025-W02 → segunda-feira 2025-01-06', () => {
    const d = isoWeekToDate('2025-W02');
    expect(d.toISOString().slice(0, 10)).toBe('2025-01-06');
  });
  it('roundtrip: dateToISOWeek(isoWeekToDate(w)) === w', () => {
    const weeks = ['2025-W01', '2025-W15', '2025-W52', '2026-W01'];
    weeks.forEach(w => {
      expect(dateToISOWeek(isoWeekToDate(w))).toBe(w);
    });
  });
});

describe('isFutureWeek', () => {
  it('semana claramente passada retorna false', () => {
    expect(isFutureWeek('2020-W01')).toBe(false);
  });
  it('semana claramente futura retorna true', () => {
    expect(isFutureWeek('2099-W52')).toBe(true);
  });
  it('semana atual retorna false', () => {
    const current = getCurrentISOWeek();
    expect(isFutureWeek(current)).toBe(false);
  });
});

describe('generateWeeksScale', () => {
  it('gera pelo menos 1 semana para intervalo de 7 dias', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 6), new Date(2025, 0, 12));
    expect(weeks.length).toBeGreaterThanOrEqual(1);
  });
  it('não tem semanas duplicadas', () => {
    const weeks = generateWeeksScale(new Date(2024, 11, 1), new Date(2025, 2, 31));
    expect(new Set(weeks).size).toBe(weeks.length);
  });
  it('todas as semanas estão em ordem crescente', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 1), new Date(2025, 5, 30));
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i] > weeks[i - 1]).toBe(true);
    }
  });
  it('a primeira semana contém ou é anterior à data de início', () => {
    const start = new Date(2025, 0, 15);
    const weeks = generateWeeksScale(start, new Date(2025, 1, 15));
    expect(weeks[0] <= dateToISOWeek(start)).toBe(true);
  });
});

describe('formatWeekLabel', () => {
  it('formata 2025-W01 como S01', () => {
    expect(formatWeekLabel('2025-W01')).toBe('S01');
  });
  it('formata 2025-W42 como S42', () => {
    expect(formatWeekLabel('2025-W42')).toBe('S42');
  });
});

describe('groupWeeksByMonth', () => {
  it('2025-W01 (quinta = 2 jan) fica no grupo jan/25', () => {
    const groups = groupWeeksByMonth(['2025-W01', '2025-W02', '2025-W03']);
    expect(groups[0].label.toLowerCase()).toMatch(/jan/);
    expect(groups[0].weeks).toContain('2025-W01');
  });
  it('gera múltiplos grupos para range de 3 meses', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 1), new Date(2025, 2, 31));
    const groups = groupWeeksByMonth(weeks);
    expect(groups.length).toBeGreaterThanOrEqual(3);
  });
  it('cada semana aparece em exatamente um grupo', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 1), new Date(2025, 2, 31));
    const groups = groupWeeksByMonth(weeks);
    const allWeeks = groups.flatMap(g => g.weeks);
    expect(allWeeks.length).toBe(weeks.length);
    expect(new Set(allWeeks).size).toBe(weeks.length);
  });
});
