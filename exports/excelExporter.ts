/**
 * ExcelExporter - MorfEmail Export Module
 * Genera hojas de cálculo nativas .XLSX con formateo de columnas y anchos automáticos.
 */

import * as XLSX from 'xlsx';
import { NormalizedLead } from '../engine/types';

export class ExcelExporter {
  public static generateWorkbook(leads: NormalizedLead[]): XLSX.WorkBook {
    const data = leads.map((lead) => ({
      'Business Name': lead.businessName,
      'Email': lead.email,
      'Phone': lead.phone,
      'WhatsApp': lead.whatsapp || '',
      'Website': lead.website,
      'Address': lead.address,
      'City': lead.city,
      'Region': lead.region,
      'Country': lead.country,
      'Category': lead.category,
      'Facebook': lead.facebook || '',
      'Instagram': lead.instagram || '',
      'LinkedIn': lead.linkedin || '',
      'Source URL': lead.sourceUrl,
      'Discovered At': lead.discoveredAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columnas óptimos
    const colWidths = [
      { wch: 30 }, // Business Name
      { wch: 28 }, // Email
      { wch: 18 }, // Phone
      { wch: 25 }, // WhatsApp
      { wch: 30 }, // Website
      { wch: 32 }, // Address
      { wch: 18 }, // City
      { wch: 18 }, // Region
      { wch: 18 }, // Country
      { wch: 20 }, // Category
      { wch: 25 }, // Facebook
      { wch: 25 }, // Instagram
      { wch: 25 }, // LinkedIn
      { wch: 30 }, // Source URL
      { wch: 22 }  // Discovered At
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MorfEmail B2B Leads');
    return workbook;
  }

  public static downloadExcel(leads: NormalizedLead[], filename = 'morfemail_leads.xlsx'): void {
    const workbook = this.generateWorkbook(leads);
    XLSX.writeFile(workbook, filename);
  }
}
