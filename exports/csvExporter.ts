/**
 * CsvExporter - MorfEmail Export Module
 * Genera archivos CSV compatibles con RFC 4180 y soporte UTF-8 BOM para apertura perfecta en Excel.
 */

import { NormalizedLead } from '../engine/types';

export class CsvExporter {
  public static generateCsv(leads: NormalizedLead[]): string {
    const headers = [
      'Business Name',
      'Email',
      'Phone',
      'WhatsApp',
      'Website',
      'Address',
      'City',
      'Region',
      'Country',
      'Category',
      'Facebook',
      'Instagram',
      'LinkedIn',
      'Source URL',
      'Discovered At'
    ];

    const rows = leads.map((lead) => [
      this.escapeCsv(lead.businessName),
      this.escapeCsv(lead.email),
      this.escapeCsv(lead.phone),
      this.escapeCsv(lead.whatsapp || ''),
      this.escapeCsv(lead.website),
      this.escapeCsv(lead.address),
      this.escapeCsv(lead.city),
      this.escapeCsv(lead.region),
      this.escapeCsv(lead.country),
      this.escapeCsv(lead.category),
      this.escapeCsv(lead.facebook || ''),
      this.escapeCsv(lead.instagram || ''),
      this.escapeCsv(lead.linkedin || ''),
      this.escapeCsv(lead.sourceUrl),
      this.escapeCsv(lead.discoveredAt)
    ]);

    // Incluir UTF-8 BOM para compatibilidad con Windows Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return csvContent;
  }

  public static downloadCsv(leads: NormalizedLead[], filename = 'morfemail_leads.csv'): void {
    const csv = this.generateCsv(leads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static escapeCsv(field: string): string {
    if (!field) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  }
}
