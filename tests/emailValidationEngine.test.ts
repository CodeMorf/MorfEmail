/**
 * MorfEmail Validation Engine - Comprehensive Automated Test Suite
 * Ejecuta pruebas unitarias y de integración para validar todas las capas del motor.
 */

import { SyntaxValidator } from '../engine/validation/syntaxValidator';
import { DomainNormalizer } from '../engine/validation/domainNormalizer';
import { DisposableDomainService } from '../engine/validation/disposableDomainService';
import { FreeProviderService } from '../engine/validation/freeProviderService';
import { ConfidenceCalculator } from '../engine/validation/confidenceCalculator';
import { DomainValidationCache } from '../engine/validation/domainValidationCache';
import { EmailValidationService } from '../engine/validation/emailValidationService';
import { SmtpValidationService } from '../engine/validation/smtpValidationService';
import { ValidationService } from '../src/services/validationService';

async function runTests() {
  console.log('====================================================');
  console.log(' MorfEmail Real Email Validation Engine Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(description: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${description} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 1: SINTAXIS RFC 5321 / RFC 5322
  // ----------------------------------------------------
  console.log('1. Probando Nivel 1 - Sintaxis RFC:');

  const validEmails = [
    'usuario@dominio.com',
    'ventas.corporativas@empresa.com.do',
    'john.doe+tag@sub.domain.co.uk',
    'contact_123-abc@my-host.org',
    'admin@empresa.es'
  ];

  for (const email of validEmails) {
    const res = SyntaxValidator.validate(email);
    assert(`Email válido aceptado: ${email}`, res.isValid, res.error);
  }

  const invalidEmails = [
    '',
    'no-at-symbol.com',
    '@nodomain.com',
    'user@',
    'user..name@domain.com',
    '.user@domain.com',
    'user.@domain.com',
    'user@domain..com',
    'user@.domain.com',
    'user@domain.c', // TLD menor a 2 caracteres
    'user@domain.123', // TLD estrictamente numérico
    'user space@domain.com',
    'user@dom ain.com'
  ];

  for (const email of invalidEmails) {
    const res = SyntaxValidator.validate(email);
    assert(`Email inválido rechazado: "${email}"`, !res.isValid, `Debería fallar: ${res.error}`);
  }

  // ----------------------------------------------------
  // TEST SUITE 2: NORMALIZACIÓN DE DOMINIO
  // ----------------------------------------------------
  console.log('\n2. Probando Nivel 2 - Normalización de Dominio:');

  assert(
    'Normaliza correo con mayúsculas y espacios',
    DomainNormalizer.normalizeEmail('  Ventas@Empresa.COM  ') === 'Ventas@empresa.com'
  );

  assert(
    'Elimina www. erróneo del dominio',
    DomainNormalizer.normalizeDomain('www.empresa.com') === 'empresa.com'
  );

  assert(
    'Extrae dominio limpio desde URL',
    DomainNormalizer.normalizeDomain('https://mi-negocio.com/contacto') === 'mi-negocio.com'
  );

  // ----------------------------------------------------
  // TEST SUITE 3: DETECCIÓN DE DOMINIOS DESECHABLES
  // ----------------------------------------------------
  console.log('\n3. Probando Nivel 4 - Detección de Temporales / Disposable:');

  const disposableService = DisposableDomainService.getInstance();

  const disposables = ['mailinator.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org', 'sub.mailinator.com'];
  for (const d of disposables) {
    assert(`Detecta dominio desechable: ${d}`, disposableService.isDisposable(d));
  }

  const legits = ['google.com', 'microsoft.com', 'empresa.com.do', 'bancosantander.es'];
  for (const d of legits) {
    assert(`No marca dominio legítimo como desechable: ${d}`, !disposableService.isDisposable(d));
  }

  // ----------------------------------------------------
  // TEST SUITE 4: DETECCIÓN DE PROVEEDORES WEBMAIL
  // ----------------------------------------------------
  console.log('\n4. Probando Nivel 5 - Identificación Webmail:');

  const freeDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me'];
  for (const d of freeDomains) {
    assert(`Identifica webmail: ${d}`, FreeProviderService.isFreeProvider(d));
  }

  assert('No marca dominio corporativo como webmail', !FreeProviderService.isFreeProvider('toyota.com'));

  // ----------------------------------------------------
  // TEST SUITE 5: CALCULO DE PUNTAJE Y ESTADOS
  // ----------------------------------------------------
  console.log('\n5. Probando Cálculo de Confianza & Estados Técnicos:');

  // Caso: Sintaxis inválida
  const invalidScore = ConfidenceCalculator.calculate({
    syntaxValid: false,
    dnsResult: { domain: 'fake', domainExists: false, mxExists: false, mxRecords: [], nullMx: false },
    isDisposable: false,
    isFreeProvider: false
  });
  assert('Sintaxis inválida da estado INVALID y score 0', invalidScore.status === 'INVALID' && invalidScore.score === 0);

  // Caso: Null MX (RFC 7505)
  const nullMxScore = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: { domain: 'nullmx.org', domainExists: true, mxExists: false, mxRecords: [], nullMx: true },
    isDisposable: false,
    isFreeProvider: false
  });
  assert('Null MX da estado INVALID con razón RFC 7505', nullMxScore.status === 'INVALID' && nullMxScore.score === 0);

  // Caso: Dominio inexistente (NXDOMAIN)
  const nxScore = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: { domain: 'nonexistent-xyz.com', domainExists: false, mxExists: false, mxRecords: [], nullMx: false },
    isDisposable: false,
    isFreeProvider: false
  });
  assert('NXDOMAIN da estado INVALID', nxScore.status === 'INVALID' && nxScore.score <= 10);

  // Caso: Webmail legítimo (Gmail / Outlook)
  const gmailScore = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: {
      domain: 'gmail.com',
      domainExists: true,
      mxExists: true,
      mxRecords: [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }],
      nullMx: false
    },
    isDisposable: false,
    isFreeProvider: true
  });
  assert('Gmail con MX es clasificado como VALID', gmailScore.status === 'VALID' && gmailScore.score >= 80);

  // Caso: Dominio corporativo con MX
  const corpScore = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: {
      domain: 'empresa.com',
      domainExists: true,
      mxExists: true,
      mxRecords: [{ priority: 10, exchange: 'mail.empresa.com' }],
      nullMx: false
    },
    isDisposable: false,
    isFreeProvider: false
  });
  assert('Dominio corporativo con MX es VALID con score alto', corpScore.status === 'VALID' && corpScore.score >= 85);

  // ----------------------------------------------------
  // TEST SUITE 6: CACHÉ DE DOMINIOS
  // ----------------------------------------------------
  console.log('\n6. Probando DomainValidationCache:');

  const cache = DomainValidationCache.getInstance();
  cache.clear();

  cache.set('testdomain.com', {
    domain: 'testdomain.com',
    domainExists: true,
    mxExists: true,
    mxRecords: [{ priority: 10, exchange: 'mail.testdomain.com' }],
    nullMx: false
  });

  const fromCache = cache.get('testdomain.com');
  assert('Recupera resultado almacenado en caché', fromCache !== null && fromCache.mxExists === true);
  assert('Marca propiedad fromCache como true', fromCache?.fromCache === true);

  // ----------------------------------------------------
  // TEST SUITE 7: INTEGRACIÓN REAL DEL MOTOR (DNS LIVE)
  // ----------------------------------------------------
  console.log('\n7. Probando Validación Real con resolución DNS Live:');

  try {
    const realResult = await EmailValidationService.validate('contacto@google.com');
    assert('Valida contacto@google.com con registros MX reales', realResult.status === 'VALID' && realResult.mxExists === true);
    assert('Obtiene servidores MX de Google reales', realResult.mxRecords.length > 0 && realResult.mxRecords[0].exchange.includes('google'));

    // Probar dominio inexistente
    const fakeDomainResult = await EmailValidationService.validate('test@dominio-absolutamente-inexistente-xyz99281.org');
    assert('Detecta dominio inexistente como INVALID', fakeDomainResult.status === 'INVALID' && fakeDomainResult.domainExists === false);

    // Probar disposable
    const dispResult = await EmailValidationService.validate('test@mailinator.com');
    assert('Detecta mailinator como disposable INVALID/RISKY', dispResult.disposable === true && (dispResult.status === 'INVALID' || dispResult.status === 'RISKY'));

    // Probar batch
    const batchResults = await EmailValidationService.validateBatch([
      'sales@microsoft.com',
      'invalid..email@',
      'user@yopmail.com'
    ]);
    assert('Valida lote de 3 correos en paralelo', batchResults.length === 3);
    assert('Primer correo de lote es válido', batchResults[0].status === 'VALID');
    assert('Segundo correo de lote es inválido por sintaxis', batchResults[1].syntaxValid === false);
    assert('Tercer correo de lote es desechable', batchResults[2].disposable === true);
  } catch (e: any) {
    console.log(`  (DNS live test omitido o limitado por entorno: ${e?.message})`);
  }

  // ----------------------------------------------------
  // TEST SUITE 8: CONTROL DE COLA (PAUSA, REANUDACIÓN, CANCELACIÓN) Y CATCH-ALL
  // ----------------------------------------------------
  console.log('\n8. Probando Control de Cola y Catch-All:');

  // Test Queue session
  const session = ValidationService.createQueueSession();
  assert('createQueueSession retorna cola y ejecutor', Boolean(session.queue) && typeof session.start === 'function');
  
  const statusInitial = session.queue.getStatus();
  assert('Estado inicial de cola no está corriendo', !statusInitial.isRunning && !statusInitial.isPaused && !statusInitial.isCancelled);

  session.queue.pause();
  assert('Pausa de cola activada correctamente', session.queue.getStatus().isPaused === true);

  session.queue.resume();
  assert('Reanudación de cola ejecutada correctamente', session.queue.getStatus().isPaused === false);

  session.queue.cancel();
  assert('Cancelación de cola ejecutada correctamente', session.queue.getStatus().isCancelled === true);

  // Test Smtp probe address generation
  const probeAddress = SmtpValidationService.generateRandomProbeAddress('empresa.com');
  assert('Genera dirección de sondeo aleatoria válida', probeAddress.startsWith('morf_probe_') && probeAddress.endsWith('@empresa.com'));

  // Test Confidence Calculator with Catch-All
  const catchAllResult = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: {
      domain: 'empresa.com',
      domainExists: true,
      mxExists: true,
      mxRecords: [{ priority: 10, exchange: 'mail.empresa.com' }],
      nullMx: false
    },
    isDisposable: false,
    isFreeProvider: false,
    isRoleAccount: false,
    smtpResult: {
      attempted: true,
      reachable: true,
      recipientAccepted: true,
      catchAll: true,
      technicalStatus: 'RISKY',
      responseCode: 250,
      responseMessage: '250 OK'
    }
  });

  assert('Catch-All detectado califica como estado RISKY', catchAllResult.status === 'RISKY');
  assert('Catch-All aplica penalización adecuada en score', catchAllResult.signals.catchAllPenalty === -20);

  // ----------------------------------------------------
  // TEST SUITE 9: SMTP MULTILÍNEA Y EVALUACIÓN DE CÓDIGOS RFC 5321
  // ----------------------------------------------------
  console.log('\n9. Probando Parser Multilínea SMTP y Evaluación de Códigos:');

  // Test multiline parser
  const multilineSample = "250-mx.google.com at your service\r\n250-SIZE 157286400\r\n250-8BITMIME\r\n250-STARTTLS\r\n250-ENHANCEDSTATUSCODES\r\n250-PIPELINING\r\n250-CHUNKING\r\n250 SMTPUTF8";
  const parsedMulti = SmtpValidationService.parseMultilineResponse(multilineSample);
  assert('Parsea respuesta multilínea RFC 5321 correctamente', parsedMulti.isComplete && parsedMulti.isMultiline && parsedMulti.code === 250);
  assert('Contiene todas las líneas de respuesta', parsedMulti.lines.length === 8);

  // Test single line 250 OK
  const parsed250 = SmtpValidationService.parseMultilineResponse("250 2.1.5 Recipient OK");
  assert('Parsea 250 OK simple', parsed250.code === 250 && parsed250.isComplete && !parsed250.isMultiline);

  // Test 550 Mailbox not found
  const parsed550 = SmtpValidationService.parseMultilineResponse("550 5.1.1 <fakeuser@domain.com>: Recipient address rejected: User unknown");
  assert('Parsea 550 Recipient rejected', parsed550.code === 550 && !parsed550.isGreylisted);

  const eval550 = SmtpValidationService.evaluateSmtpCode(550, parsed550.message);
  assert('Código 550 evalúa a UNDELIVERABLE con recipientAccepted = false', eval550.technicalStatus === 'UNDELIVERABLE' && eval550.recipientAccepted === false);

  // Test 551, 552, 553, 554
  for (const code of [551, 552, 553, 554]) {
    const evalCode = SmtpValidationService.evaluateSmtpCode(code, 'Permanent error');
    assert(`Código ${code} evalúa a UNDELIVERABLE`, evalCode.technicalStatus === 'UNDELIVERABLE' && evalCode.recipientAccepted === false);
  }

  // Test 450 / 451 Greylisting
  const parsedGreylist450 = SmtpValidationService.parseMultilineResponse("450 4.2.0 <user@domain.com>: Greylisted, please try again in 300 seconds");
  assert('Detecta 450 como greylisted', parsedGreylist450.isGreylisted && parsedGreylist450.code === 450);
  const eval450 = SmtpValidationService.evaluateSmtpCode(450, parsedGreylist450.message);
  assert('450 Greylisted evalúa a RISKY con recipientAccepted = null', eval450.technicalStatus === 'RISKY' && eval450.recipientAccepted === null);

  const eval451 = SmtpValidationService.evaluateSmtpCode(451, "451 4.7.1 Service unavailable - try again later");
  assert('451 Greylisted evalúa a RISKY', eval451.technicalStatus === 'RISKY' && eval451.isGreylisted);

  // Test 421 Service unavailable (debe ser UNKNOWN para intentar siguiente MX)
  const eval421 = SmtpValidationService.evaluateSmtpCode(421, "421 4.7.0 Too many connections, closing transmission channel");
  assert('421 evalúa a UNKNOWN con isTemporary = true', eval421.technicalStatus === 'UNKNOWN' && eval421.isTemporary);

  // ----------------------------------------------------
  // TEST SUITE 10: REGLAS DE CONFIANZA SMTP (UNKNOWN != INVALID / NO FALSE DELIVERABLE)
  // ----------------------------------------------------
  console.log('\n10. Probando Reglas de Confianza e Inconcluso SMTP:');

  // Caso: SMTP solicitado pero falló por timeout / puerto 25 bloqueado
  const smtpUnknownCalc = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: {
      domain: 'banco.com',
      domainExists: true,
      mxExists: true,
      mxRecords: [{ priority: 10, exchange: 'mx1.banco.com' }, { priority: 20, exchange: 'mx2.banco.com' }],
      nullMx: false
    },
    isDisposable: false,
    isFreeProvider: false,
    smtpResult: {
      attempted: true,
      reachable: false,
      technicalStatus: 'UNKNOWN',
      responseMessage: 'Timeout en puerto 25'
    }
  });
  assert('SMTP inconcluso (timeout/bloqueo) da estado UNKNOWN (nunca INVALID ni falso VALID)', smtpUnknownCalc.status === 'UNKNOWN');

  // Caso: SMTP con greylisting 450 da estado RISKY
  const smtpGreylistCalc = ConfidenceCalculator.calculate({
    syntaxValid: true,
    dnsResult: {
      domain: 'empresa.es',
      domainExists: true,
      mxExists: true,
      mxRecords: [{ priority: 10, exchange: 'mail.empresa.es' }],
      nullMx: false
    },
    isDisposable: false,
    isFreeProvider: false,
    smtpResult: {
      attempted: true,
      reachable: true,
      greylisted: true,
      responseCode: 450,
      technicalStatus: 'RISKY',
      responseMessage: '450 Greylisted'
    }
  });
  assert('SMTP Greylisted da estado RISKY con mensaje explicativo', smtpGreylistCalc.status === 'RISKY');

  // ----------------------------------------------------
  // TEST SUITE 11: CANCELACIÓN REAL MEDIANTE ABORTSIGNAL
  // ----------------------------------------------------
  console.log('\n11. Probando Cancelación Real con AbortSignal:');

  const abortController = new AbortController();
  abortController.abort();

  const abortedSmtp = await SmtpValidationService.verifySmtp('test@google.com', 'aspmx.l.google.com', {
    signal: abortController.signal
  });
  assert('SmtpValidationService cancela inmediatamente cuando el signal está abortado', abortedSmtp.technicalStatus === 'UNKNOWN' && abortedSmtp.error?.includes('cancelada'));

  console.log('\n====================================================');
  console.log(` Resumen de Pruebas: ${passed} Pasadas | ${failed} Fallidas`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Error fatal ejecutando pruebas:', e);
  process.exit(1);
});
