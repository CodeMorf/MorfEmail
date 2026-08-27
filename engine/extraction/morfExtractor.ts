/**
 * MorfExtractor - Motor de Extracción Central de MorfEmail
 * Módulo unificado para análisis profundo de contenido HTML y metadatos.
 */

import { EmailExtractor } from './emailExtractor';
import { PhoneExtractor } from './phoneExtractor';
import { WhatsappExtractor } from './whatsappExtractor';
import { SocialExtractor } from './socialExtractor';
import { BusinessExtractor } from './businessExtractor';
import { AddressExtractor } from './addressExtractor';
import { StructuredDataExtractor } from './structuredDataExtractor';
import { RawExtractedData } from '../types';

export class MorfExtractor {
  /**
   * Ejecuta el pipeline completo de extracción sobre una página HTML.
   */
  public static extractFromHtml(
    html: string,
    pageUrl: string,
    hints?: {
      category?: string;
      city?: string;
      country?: string;
      defaultCountryCode?: string;
      renderedWith?: 'cheerio' | 'playwright';
      httpStatus?: number;
    }
  ): RawExtractedData {
    let domain = '';
    try {
      domain = new URL(pageUrl).hostname.replace(/^www\./, '');
    } catch {
      domain = pageUrl;
    }

    // 1. Extraer JSON-LD y datos estructurados prioritarios
    const structured = StructuredDataExtractor.extract(html);

    // 2. Extraer emails
    const emails = EmailExtractor.extract(html, domain);
    if (structured?.email && !emails.includes(structured.email)) {
      emails.unshift(structured.email);
    }

    // 3. Extraer teléfonos
    const phones = PhoneExtractor.extract(html, hints?.defaultCountryCode || '1');
    if (structured?.telephone) {
      const exists = phones.some((p) => p.formattedNumber.includes(structured.telephone!));
      if (!exists) {
        phones.unshift({
          formattedNumber: structured.telephone,
          raw: structured.telephone
        });
      }
    }

    // 4. Extraer WhatsApp
    const whatsapp = WhatsappExtractor.extract(html);

    // 5. Extraer Redes Sociales
    const socials = SocialExtractor.extract(html);
    if (structured?.sameAs) {
      for (const link of structured.sameAs) {
        if (link.includes('facebook.com') && !socials.facebook) socials.facebook = link;
        if (link.includes('instagram.com') && !socials.instagram) socials.instagram = link;
        if (link.includes('linkedin.com') && !socials.linkedin) socials.linkedin = link;
        if (link.includes('twitter.com') || link.includes('x.com')) socials.twitter = link;
        if (link.includes('youtube.com') && !socials.youtube) socials.youtube = link;
      }
    }

    // 6. Extraer Datos Comerciales & Metadatos
    const businessMeta = BusinessExtractor.extract(html, domain);
    const resolvedName = structured?.name || businessMeta.businessName || domain;

    // 7. Extraer Dirección
    const address = AddressExtractor.extract(html, hints?.city, hints?.country);
    if (structured?.address) {
      if (structured.address.streetAddress) address.street = structured.address.streetAddress;
      if (structured.address.addressLocality) address.city = structured.address.addressLocality;
      if (structured.address.addressRegion) address.region = structured.address.addressRegion;
      if (structured.address.postalCode) address.postalCode = structured.address.postalCode;
    }

    // 8. Buscar enlaces a páginas secundarias relevantes (/contacto, /about, etc.)
    const contactPageUrls = this.findContactUrls(html, pageUrl);
    const aboutPageUrls = this.findAboutUrls(html, pageUrl);

    // 9. Calcular puntuación de confianza (0 - 100)
    let score = 30; // base por encontrar sitio activo
    if (emails.length > 0) score += 35;
    if (phones.length > 0) score += 20;
    if (whatsapp) score += 10;
    if (socials.facebook || socials.instagram || socials.linkedin) score += 5;
    score = Math.min(100, score);

    return {
      url: pageUrl,
      domain,
      title: businessMeta.ogTitle,
      metaDescription: businessMeta.description,
      h1: businessMeta.h1,
      businessName: resolvedName,
      category: structured?.category || hints?.category || 'Empresa Local',
      emails,
      phones,
      whatsapp,
      socials,
      address,
      contactPageUrls,
      aboutPageUrls,
      confidenceScore: score,
      discoveredAt: new Date().toISOString(),
      httpStatus: hints?.httpStatus || 200,
      renderedWith: hints?.renderedWith || 'cheerio'
    };
  }

  /**
   * Identifica enlaces a páginas de contacto para crawling de profundidad 2.
   */
  private static findContactUrls(html: string, baseUrl: string): string[] {
    const urls = new Set<string>();
    const linkRegex = /href=["']([^"'>\s]+)["']/gi;
    const contactKeywords = ['contact', 'contacto', 'contact-us', 'contactanos', 'contactenos', 'atencion'];

    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const rawHref = match[1];
      const lower = rawHref.toLowerCase();

      const isContact = contactKeywords.some((kw) => lower.includes(kw));
      if (isContact && !lower.startsWith('mailto:') && !lower.startsWith('tel:')) {
        try {
          const absolute = new URL(rawHref, baseUrl).href;
          // Sólo links del mismo dominio
          if (new URL(absolute).hostname === new URL(baseUrl).hostname) {
            urls.add(absolute);
          }
        } catch {
          // Ignorar URLs inválidas
        }
      }
    }

    return Array.from(urls).slice(0, 3);
  }

  /**
   * Identifica enlaces a páginas de Nosotros / About.
   */
  private static findAboutUrls(html: string, baseUrl: string): string[] {
    const urls = new Set<string>();
    const linkRegex = /href=["']([^"'>\s]+)["']/gi;
    const aboutKeywords = ['about', 'nosotros', 'quienes-somos', 'empresa', 'equipo', 'team'];

    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const rawHref = match[1];
      const lower = rawHref.toLowerCase();

      const isAbout = aboutKeywords.some((kw) => lower.includes(kw));
      if (isAbout && !lower.startsWith('mailto:') && !lower.startsWith('tel:')) {
        try {
          const absolute = new URL(rawHref, baseUrl).href;
          if (new URL(absolute).hostname === new URL(baseUrl).hostname) {
            urls.add(absolute);
          }
        } catch {
          // Ignorar URLs inválidas
        }
      }
    }

    return Array.from(urls).slice(0, 3);
  }
}
