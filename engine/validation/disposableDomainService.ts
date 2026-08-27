/**
 * DisposableDomainService - MorfEmail Level 4 Disposable / Temporary Email Service
 * Sistema de detección de dominios temporales, desechables y generadores de correos basura.
 * Permite cargar listas open-source y extender la base de datos de dominios efímeros.
 */

export class DisposableDomainService {
  private static instance: DisposableDomainService;
  private disposableSet: Set<string>;

  private constructor() {
    this.disposableSet = new Set<string>();
    this.loadBuiltinDomains();
  }

  public static getInstance(): DisposableDomainService {
    if (!this.instance) {
      this.instance = new DisposableDomainService();
    }
    return this.instance;
  }

  /**
   * Comprueba si un dominio pertenece a un servicio de correo temporal / desechable.
   */
  public isDisposable(domain: string): boolean {
    if (!domain) return false;
    const cleanDomain = domain.toLowerCase().trim();

    // 1. Coincidencia directa
    if (this.disposableSet.has(cleanDomain)) {
      return true;
    }

    // 2. Comprobar subdominios (ej. sub.mailinator.com -> mailinator.com)
    const parts = cleanDomain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const rootCandidate = parts.slice(i).join('.');
      if (this.disposableSet.has(rootCandidate)) {
        return true;
      }
    }

    // 3. Patrones de nombres comunes de temporales
    const disposableKeywords = [
      'tempmail', '10minutemail', 'guerrillamail', 'throwawaymail',
      'trashmail', 'fakeinbox', 'dispostable', 'mailinator', 'yopmail',
      'sharklasers', 'getnada', 'temp-mail', 'mohmal', 'maildrop'
    ];

    for (const kw of disposableKeywords) {
      if (cleanDomain.includes(kw)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Carga una lista adicional de dominios desechables.
   */
  public addDomains(domains: string[]): number {
    let added = 0;
    for (const d of domains) {
      const clean = d.trim().toLowerCase();
      if (clean && !this.disposableSet.has(clean)) {
        this.disposableSet.add(clean);
        added++;
      }
    }
    return added;
  }

  public getDomainCount(): number {
    return this.disposableSet.size;
  }

  /**
   * Carga la base de datos integrada de dominios desechables conocidos.
   */
  private loadBuiltinDomains(): void {
    const commonDisposable = [
      '0815.ru', '0-mail.com', '0clickemail.com', '10minutemail.be', '10minutemail.cf',
      '10minutemail.co.uk', '10minutemail.co.za', '10minutemail.com', '10minutemail.de',
      '10minutemail.info', '10minutemail.net', '10minutemail.nl', '10minutemail.org',
      '10minutemail.pl', '10minutemail.pro', '10minutemailbox.com', '10x.es', '123-m.com',
      '12minutemail.com', '1secmail.com', '1secmail.net', '1secmail.org', '20minutemail.com',
      '20minutemail.it', '2prong.com', '30minutemail.com', '3d-painting.com', '4warding.com',
      '4warding.net', '4warding.org', '5minutemail.com', '60minutemail.com', '675hosting.com',
      '675hosting.net', '675hosting.org', '6url.com', '75hosting.com', '75hosting.net',
      '75hosting.org', '7tags.com', '9ox.net', 'a-bc.net', 'afia.pro', 'agedmail.com',
      'airmail.news', 'anonaddy.com', 'anonaddy.me', 'anonmails.de', 'anonymbox.com',
      'antichef.com', 'antichef.net', 'antispam.de', 'baxomale.ht.cx', 'beefmilk.com',
      'binkmail.com', 'bio-mull.info', 'bobmail.info', 'bodhi.lawlita.com', 'bofthew.com',
      'boun.cr', 'bouncr.com', 'boximail.com', 'breakthru.com', 'brefmail.com', 'broadbandninja.com',
      'bsnow.net', 'bugmenot.com', 'bumpymail.com', 'burners.info', 'burntmail.com',
      'burstmail.com', 'cachedot.net', 'camelfarm.org', 'cartelera.org', 'cashette.com',
      'centermail.com', 'centermail.net', 'chacuo.net', 'chogmail.com', 'chong-mail.com',
      'clrmail.com', 'cmail.club', 'cmail.com', 'cmail.net', 'cmail.org', 'cool.fr.nf',
      'correo.blogos.net', 'cosmorph.com', 'courrieltemporaire.com', 'crapmail.org',
      'crazymailing.com', 'curryjunkies.biz', 'cust.in', 'daffy.org', 'dahe.in',
      'damnthespam.com', 'dayrep.com', 'deadaddress.com', 'deadaddress.net',
      'deadspam.com', 'deakmail.com', 'decabox.com', 'delayemail.com', 'delikatedog.com',
      'deliverme.be', 'devnullmail.com', 'dfgh.net', 'discard.email', 'discardmail.com',
      'discardmail.de', 'disposable-email.ml', 'disposable.com', 'disposableaddress.com',
      'disposableemail.org', 'disposableinbox.com', 'disposablemail.com', 'dispostable.com',
      'docmail.cz', 'dodgeit.com', 'dodgit.com', 'doerner.org', 'domozhost.com',
      'dontext.com', 'dontreg.com', 'dontsendmespam.de', 'drdrb.com', 'dropmail.me',
      'dudemail.com', 'dump-email.info', 'dumpemail.com', 'dumpmail.de', 'dumpyemail.com',
      'e-mail.am', 'e4ward.com', 'easytrashmail.com', 'einrot.com', 'eintagsuhr.de',
      'einweg-email.de', 'einweg-mail.de', 'einwegadresse.de', 'einwegmail.com',
      'einwegmail.de', 'einwegmail.net', 'einwegmail.org', 'email-fake.com',
      'email-generator.net', 'email-temporaire.fr', 'email.crapmail.org', 'email60.com',
      'emailage.de', 'emaildienst.de', 'emailigo.de', 'emailinfive.com', 'emailmiser.com',
      'emailsensei.com', 'emailproxsy.com', 'emailtemporaneo.net', 'emailthe.net',
      'emailto.de', 'emailwarden.com', 'emailx.at.tc', 'emailxfer.com', 'emailz.biz',
      'emeil.in', 'emeil.ir', 'eml.cc', 'emlhub.com', 'emltmp.com', 'ephemail.net',
      'ephemeralmail.com', 'esb.ro', 'etranquil.com', 'etranquil.net', 'etranquil.org',
      'evade.at.tc', 'evomail.net', 'explodemail.com', 'expressmail.org', 'eyepaste.com',
      'eztrashmail.com', 'fackme.gq', 'fake-box.com', 'fakeinbox.com', 'fakemail.fr',
      'fakemailgenerator.com', 'fakemailgenerator.net', 'fakenewsagency.com', 'fastcheetah.com',
      'fastmail.at', 'fastmail.ch', 'fastmail.co.uk', 'fastmail.co.za', 'fastmail.com.au',
      'fastmail.es', 'fastmail.fm', 'fastmail.in', 'fastmail.jp', 'fastmail.net',
      'fastmail.nl', 'fastmail.org', 'fastmail.us', 'fastmailbox.net', 'fastmailin.net',
      'filzmail.com', 'fizmail.com', 'fleckens.hu', 'fmail.com', 'fmail.net', 'free-email.org',
      'freemail.ms', 'freemailstore.com', 'freeme.ws', 'freeml.net', 'freundin.ru',
      'front14.org', 'fudge.org', 'fux0ringduh.com', 'fyii.de', 'garliclife.com',
      'gelden.hu', 'generator.email', 'get-mail.eu', 'getairmail.com', 'getnada.com',
      'getonemail.com', 'gettempmail.com', 'ghostaddress.com', 'ghostmail.com',
      'gishpuppy.com', 'glubex.com', 'gomail.in', 'goodmail.in', 'gorillasmail.com',
      'gotted.org', 'gottsim.com', 'gowikicool.com', 'gpm.st', 'greatmail.in',
      'greensloth.com', 'groupbuff.com', 'guerrillamail.biz', 'guerrillamail.com',
      'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
      'guerrillamailblock.com', 'gupmail.com', 'gustr.com', 'guywithhair.com',
      'haltospam.com', 'harakirimail.com', 'hartbot.de', 'hatespam.org', 'hazecollective.com',
      'hellodirty.com', 'hidemail.de', 'hidemyass.com', 'hmamail.com', 'hopto.org',
      'host164.com', 'hotpop.com', 'hotpop.org', 'hulapla.de', 'humn.ws', 'hydroponicplants.info',
      'ieatspam.com', 'ieatspam.info', 'ikbenspamvrij.nl', 'inbox.si', 'inboxalias.com',
      'inboxclean.com', 'inboxclean.org', 'inboxdesign.me', 'inboxproxy.com', 'incognitomail.org',
      'infomail.in', 'inorbit.com', 'inreachmail.com', 'instant-mail.com', 'instantemailaddress.com',
      'instantmail.org', 'ipoo.org', 'ironymail.com', 'isup.me', 'itishere.net',
      'jetable.com', 'jetable.fr.nf', 'jetable.net', 'jetable.org', 'ji5.de', 'ji6.de',
      'jmail.ovh', 'journeyofaphotographer.com', 'jstrick.com', 'junk1e.com', 'junkemail.com',
      'junkmail.com', 'junkmail.de', 'junkmail.net', 'junkmail.org', 'justemail.net',
      'kasmail.com', 'keepmymail.com', 'kickassmail.com', 'killmail.com', 'killmail.net',
      'kleinemail.com', 'klikr.org', 'kmail.com', 'kmail.net', 'kontactr.com',
      'kroovy.com', 'krsworld.com', 'kuhrap.com', 'kursiv.net', 'kurzepost.de',
      'l-m.biz', 'l-m.info', 'l-m.org', 'labetteraverouge.fr', 'laste.ml', 'lastmail.com',
      'lazyinbox.com', 'letthemeatspam.com', 'lifebyfood.com', 'likemail.net',
      'limpmail.com', 'link2mail.net', 'litebox.eu', 'literaturlabor.com', 'litedrop.com',
      'livemail.at', 'livemail.be', 'livemail.ch', 'livemail.co.za', 'livemail.es',
      'livemail.hu', 'livemail.in', 'livemail.it', 'livemail.nl', 'livemail.pl',
      'livemail.se', 'll47.net', 'loadmail.info', 'login-email.com', 'loopmail.com',
      'lopl.com', 'lovebirds.com', 'lowiqmail.com', 'lt1.org', 'lukin.be', 'm-m.in',
      'm-m.org', 'm-s-s.biz', 'm-s-s.info', 'm-s-s.net', 'm-s-s.org', 'maildrop.cc',
      'maileater.com', 'mailexpire.com', 'mailfa.org', 'mailforspam.com', 'mailfreeonline.com',
      'mailimate.com', 'mailin8.com', 'mailin8.net', 'mailin8.org', 'mailinater.com',
      'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com', 'mailinator2.net',
      'mailinator2.org', 'mailincubator.com', 'mailkeep.net', 'mailnesia.com', 'mailnull.com',
      'mailsac.com', 'mailscrap.com', 'mailseal.de', 'mailshell.com', 'mailslite.com',
      'mailspeed.ru', 'mailtastic.com', 'mailtemp.com', 'mailtemporaire.com', 'mailtemporaire.fr',
      'mailtome.de', 'mailtothis.com', 'mailtrash.net', 'mailzi.ru', 'meltmail.com',
      'mohmal.com', 'mohmal.in', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
      'mrmail.info', 'msgsafe.io', 'my10minutemail.com', 'mycleaninbox.net', 'mymail-in.net',
      'myprivateemail.com', 'mytrashmail.com', 'nada.ltd', 'nada.email', 'nada.org',
      'netjunk.org', 'netmails.net', 'nobulk.com', 'noclickemail.com', 'nofakeemail.com',
      'nogmail.org', 'nomail.xl.cx', 'nonameemail.com', 'none.com', 'nospam.ze.tc',
      'nospam4.us', 'nospamfor.us', 'nospammail.net', 'notsharingmy.info', 'nowhere.org',
      'nullmailer.com', 'nwldx.com', 'objectmail.com', 'oneoffmail.com', 'oneoffmail.net',
      'oneoffmail.org', 'onewaymail.com', 'openmail.cc', 'ordinarypress.com', 'otherinbox.com',
      'ovh.net', 'owlpic.com', 'owlymail.com', 'pacmanmail.com', 'partybombe.de',
      'pookmail.com', 'postinbox.com', 'powertrashmail.com', 'privacy.net', 'privacymail.com',
      'privatemail.com', 'privatemail.de', 'privy-mail.com', 'privy-mail.de', 'proxymail.eu',
      'punkass.com', 'puppyemail.com', 'purelog.net', 'quick-email.com', 'quickemail.info',
      'quickinbox.com', 'quickmail.info', 'quickmail.nl', 'rainmail.biz', 'rainmail.org',
      'rcpt.at', 'reallymymail.com', 'recode.me', 'reconmail.com', 'redchan.it',
      'redfeather.de', 'rediffmail.com', 'regbypass.com', 'rmqkr.net', 'rootfest.net',
      'royalmail.in', 'ruffles.de', 'safemail.at', 'safetymail.info', 'samdom.ru',
      'sandamail.com', 'sandmail.org', 'safe-mail.net', 'safetymail.de', 'satos.org',
      'sbcemail.net', 'scriptingmail.com', 'secure-mail.biz', 'secure-mail.cc', 'sendspamhere.com',
      'sharklasers.com', 'shieldmail.com', 'shieldmail.net', 'shiftmail.com', 'shortmail.net',
      'shut.net', 'sify.com', 'silkpath.de', 'simplemail.eu', 'simply-spam.de',
      'slopsbox.com', 'smartemail.org', 'sneakemail.com', 'sneakemail.net', 'sneakemail.org',
      'snkmail.com', 'sogetthis.com', 'soodonims.com', 'spambob.com', 'spambob.net',
      'spambob.org', 'spambog.com', 'spambog.de', 'spambog.ru', 'spambox.info',
      'spambox.us', 'spamcan.net', 'spamcan.org', 'spamcannibal.org', 'spamcero.com',
      'spamcon.org', 'spamcorptastic.com', 'spamcowboy.com', 'spamcowboy.net',
      'spamcowboy.org', 'spamday.com', 'spamdrain.com', 'spamdrain.net', 'spamdrain.org',
      'spameater.org', 'spamex.com', 'spamexpert.com', 'spamfree.eu', 'spamfree24.com',
      'spamfree24.de', 'spamfree24.eu', 'spamfree24.info', 'spamfree24.net', 'spamfree24.org',
      'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org', 'spamgrube.net', 'spamhater.com',
      'spamhole.com', 'spamhunter.org', 'spaminator.de', 'spaminator.net', 'spaminator.org',
      'spaml.com', 'spaml.de', 'spamlot.com', 'spammotel.com', 'spamobox.com',
      'spampal.net', 'spampoc.com', 'spampool.net', 'spamspot.com', 'spamstack.net',
      'spamstop.de', 'spamtemp.com', 'spamthisplease.com', 'spamtrail.com', 'spamtroll.net',
      'spamwipe.com', 'speed.1s.fr', 'spoofmail.de', 'sprynet.com', 'squizzy.de',
      'ssoapi.com', 'stopmyspam.org', 'superrito.com', 'suremail.info', 'svk.jp',
      'sweetxxx.de', 'tafmail.com', 'teleworm.us', 'temp-mail.de', 'temp-mail.info',
      'temp-mail.org', 'temp-mail.ru', 'temp-mailer.com', 'tempail.com', 'tempalias.com',
      'tempe-mail.com', 'tempemail.co.za', 'tempemail.com', 'tempemail.de', 'tempemail.es',
      'tempemail.info', 'tempemail.net', 'tempemail.org', 'tempemailaddress.com', 'tempemailnet.com',
      'tempinbox.co.uk', 'tempinbox.com', 'tempmail.co', 'tempmail.de', 'tempmail.eu',
      'tempmail.in', 'tempmail.it', 'tempmail.net', 'tempmail.ninja', 'tempmail.org',
      'tempmail.pro', 'tempmail.space', 'tempmail2.com', 'tempmailaddress.com', 'tempmailer.com',
      'tempmailer.de', 'tempmailer.net', 'tempmailer.org', 'temppost.org', 'temppost.ru',
      'tempr.email', 'tempres.com', 'temporaryemail.net', 'temporaryemail.org', 'temporaryforwarding.com',
      'temporaryinbox.com', 'temporarymail.com', 'temporarymail.org', 'thankyou2010.com',
      'the-fast-mail.com', 'thecloudmail.com', 'thefakeinbox.com', 'thejoker.biz',
      'thespambox.com', 'thisisnotmyrealemail.com', 'throwawayemailaddress.com',
      'throwawaymail.com', 'throwawaymailaddress.com', 'timepost.org', 'timetomail.com',
      'tinymarket.net', 'tradermail.info', 'trash-area.com', 'trash-box.de', 'trash-mail.at',
      'trash-mail.ch', 'trash-mail.com', 'trash-mail.de', 'trash-mail.net', 'trash-mail.org',
      'trash-me.com', 'trashcanmail.com', 'trashinbox.com', 'trashmail.at', 'trashmail.ch',
      'trashmail.com', 'trashmail.de', 'trashmail.fr', 'trashmail.io', 'trashmail.me',
      'trashmail.net', 'trashmail.org', 'trashmailer.com', 'trashmailer.de', 'trashymail.com',
      'trbvm.com', 'trickmail.net', 'tvstar.de', 'uggsrock.com', 'upliftnow.com',
      'ureach.com', 'valemail.net', 'valueinbox.com', 'vapordna.biz', 'vapordna.net',
      'vapordna.org', 'veryrealemail.com', 'vidalia.im', 'vmani.com', 'vuboc.com',
      'walala.org', 'walkmail.net', 'walkmail.ru', 'warpcrafter.com', 'warpmail.net',
      'wegwerf-email.at', 'wegwerf-email.ch', 'wegwerf-email.de', 'wegwerf-email.net',
      'wegwerf-mail.at', 'wegwerf-mail.ch', 'wegwerf-mail.de', 'wegwerf-mail.net',
      'wegwerfadresse.de', 'wegwerfemail.com', 'wegwerfemail.de', 'wegwerfemail.net',
      'wegwerfemail.org', 'wegwerfmail.at', 'wegwerfmail.ch', 'wegwerfmail.de', 'wegwerfmail.net',
      'wegwerfmail.org', 'wegwerfpost.de', 'weibsvolk.org', 'wetrainbayarea.com',
      'wetrainbayarea.org', 'wh4f.org', 'whyspam.me', 'willhackforfood.biz', 'willselfdestruct.com',
      'winemaven.in', 'wmail.cf', 'wohack.com', 'worldspace.org', 'wuzup.net', 'wuzupmail.net',
      'x-mail.at', 'x-mail.ch', 'x-mail.de', 'x-mail.net', 'x00.us', 'xagloo.com', 'xemail.me',
      'xemaps.com', 'xents.com', 'xjox.com', 'xmail.net', 'xmlhost.net', 'xoxy.net',
      'yada-yada.de', 'yapped.net', 'yehey.com', 'yep.it', 'yert.org', 'ymail.org',
      'yogamaven.com', 'yomail.info', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
      'yopmail.org', 'yopmail.pp.ua', 'youmail.at', 'youmail.ch', 'youmail.de',
      'youmail.in', 'youmail.net', 'youmail.org', 'ypmail.webcam', 'ytspambot.tk',
      'yuurok.com', 'za.net', 'zahadum.de', 'zehnminutenmail.de', 'zippymail.info',
      'zoemail.com', 'zoemail.net', 'zoemail.org', 'zomg.info', 'zootmail.com',
      'zre.de', 'zxcv.com', 'zxcvbnm.com', 'zzz.com'
    ];

    for (const d of commonDisposable) {
      this.disposableSet.add(d);
    }
  }
}
