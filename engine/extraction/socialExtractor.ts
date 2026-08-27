/**
 * SocialExtractor - MorfExtractor Submodule
 * Detecta perfiles sociales corporativos públicos (Facebook, Instagram, LinkedIn, X, TikTok, YouTube).
 */

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export class SocialExtractor {
  public static extract(html: string): SocialLinks {
    const socials: SocialLinks = {};
    if (!html) return socials;

    // Facebook
    const fbMatch = html.match(/https?:\/\/(?:www\.)?(?:facebook\.com|fb\.me|fb\.com)\/([A-Za-z0-9._-]+)(?<!sharer|share|dialog)/i);
    if (fbMatch && !this.isGenericSocialUrl(fbMatch[0])) {
      socials.facebook = this.cleanSocialUrl(fbMatch[0]);
    }

    // Instagram
    const igMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i);
    if (igMatch && !this.isGenericSocialUrl(igMatch[0])) {
      socials.instagram = this.cleanSocialUrl(igMatch[0]);
    }

    // LinkedIn
    const liMatch = html.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/([A-Za-z0-9._%-]+)/i);
    if (liMatch && !this.isGenericSocialUrl(liMatch[0])) {
      socials.linkedin = this.cleanSocialUrl(liMatch[0]);
    }

    // X / Twitter
    const xMatch = html.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)(?<!share|intent)/i);
    if (xMatch && !this.isGenericSocialUrl(xMatch[0])) {
      socials.twitter = this.cleanSocialUrl(xMatch[0]);
    }

    // TikTok
    const ttMatch = html.match(/https?:\/\/(?:www\.)?tiktok\.com\/@([A-Za-z0-9._-]+)/i);
    if (ttMatch && !this.isGenericSocialUrl(ttMatch[0])) {
      socials.tiktok = this.cleanSocialUrl(ttMatch[0]);
    }

    // YouTube
    const ytMatch = html.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)([A-Za-z0-9._-]+)/i);
    if (ytMatch && !this.isGenericSocialUrl(ytMatch[0])) {
      socials.youtube = this.cleanSocialUrl(ytMatch[0]);
    }

    return socials;
  }

  private static cleanSocialUrl(url: string): string {
    return url.replace(/['">].*$/, '').replace(/[/?#&]+$/, '').trim();
  }

  private static isGenericSocialUrl(url: string): boolean {
    const genericSlugs = [
      'sharer', 'share', 'intent', 'privacy', 'terms', 'home',
      'login', 'help', 'explore', 'policies', 'hashtag'
    ];
    return genericSlugs.some((slug) => url.toLowerCase().includes(`/${slug}`));
  }
}
