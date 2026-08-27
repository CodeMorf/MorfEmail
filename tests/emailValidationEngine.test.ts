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
