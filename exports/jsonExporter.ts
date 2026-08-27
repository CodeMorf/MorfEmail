/**
 * JsonExporter - MorfEmail Export Module
 * Genera archivos JSON estructurados con metadatos completos.
 */

import { NormalizedLead } from '../engine/types';

export class JsonExporter {
  public static generateJson(leads: NormalizedLead[]): string {
    const payload = {
      generator: 'MorfEmail Desktop 2.0',
      exportedAt: new Date().toISOString(),
      totalRecords: leads.length,
      leads
    };
    return JSON.stringify(payload, null, 2);
  }

  public static downloadJson(leads: NormalizedLead[], filename = 'morfemail_leads.json'): void {
    const json = this.generateJson(leads);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
