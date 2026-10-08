import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  syncVaultSchema,
  convertDocumentSchema,
  aiConvertDocumentSchema,
  verifyDocumentSchema,
  okfDocumentTypeSchema,
  freshnessStatusSchema,
} from './okf.dto';

describe('OKF Module & Document Converter (Sprint 4 DoD)', () => {
  describe('SHA-256 State Hashing Determinism', () => {
    it('debe calcular hashes idénticos para contenidos idénticos', () => {
      const content = '# Concurrencia en PostgreSQL\nPool size 20 con transacciones ACID.';
      const hash1 = crypto.createHash('sha256').update(content.trim()).digest('hex');
      const hash2 = crypto.createHash('sha256').update(content.trim()).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it('debe detectar drift si el contenido cambia aunque sea un solo caracter', () => {
      const original = '# Requisito RF-01\nAutenticación JWT';
      const modified = '# Requisito RF-01\nAutenticación JWT.'; // punto añadido

      const hashOriginal = crypto.createHash('sha256').update(original.trim()).digest('hex');
      const hashModified = crypto.createHash('sha256').update(modified.trim()).digest('hex');

      expect(hashOriginal).not.toBe(hashModified);
    });
  });

  describe('Document Taxonomy & Types', () => {
    it('debe soportar los tipos canónicos de OKF extendido', () => {
      const validTypes = [
        'PROJECT_CONTEXT',
        'REQUIREMENT_SPEC',
        'DECISION_ADR',
        'DATABASE_SCHEMA',
        'AGENT_SKILL',
        'KNOWLEDGE_BASE',
        'ARCHITECTURE_PATTERN',
        'DOCUMENT_TEMPLATE',
      ];

      validTypes.forEach((t) => {
        expect(okfDocumentTypeSchema.safeParse(t).success).toBe(true);
      });
    });

    it('debe soportar los estados de vigencia FRESH, STALE y DRIFT_DETECTED', () => {
      expect(freshnessStatusSchema.safeParse('FRESH').success).toBe(true);
      expect(freshnessStatusSchema.safeParse('STALE').success).toBe(true);
      expect(freshnessStatusSchema.safeParse('DRIFT_DETECTED').success).toBe(true);
      expect(freshnessStatusSchema.safeParse('UNKNOWN').success).toBe(false);
    });
  });

  describe('Zod Contracts for Vault Sync & Conversion', () => {
    it('debe validar un payload de sincronización en lote', () => {
      const payload = {
        documents: [
          {
            documentId: 'DOC-001',
            documentType: 'REQUIREMENT_SPEC',
            canonicalPath: '02-requirements/RF-01.md',
            title: 'Autenticación JWT',
            tags: ['arch:monolith', 'security:jwt'],
            contentPreview: 'Previsualización del requerimiento...',
            stateHash: 'a'.repeat(64),
            freshnessStatus: 'FRESH',
          },
        ],
      };

      const parsed = syncVaultSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('debe rechazar una sincronización con lista vacía de documentos', () => {
      const emptyPayload = { documents: [] };
      const parsed = syncVaultSchema.safeParse(emptyPayload);
      expect(parsed.success).toBe(false);
    });

    it('debe validar un payload para conversión mecánica de papers', () => {
      const payload = {
        rawContent: '# Arquitectura Modular en Node.js\nDirectrices de diseño...',
        title: 'Arquitectura Modular',
        targetCategory: 'knowledge-base',
        tags: ['arch:modular-monolith', 'stack:node-express'],
        author: 'Nathaniel Muller',
      };

      const parsed = convertDocumentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('debe validar un payload para conversión asistida por IA', () => {
      const payload = {
        rawContent: 'Paper de arquitectura de microservicios vs monolito...',
        contextHint: 'Evaluar para un equipo de 1 desarrollador',
        targetCategory: 'patterns',
        suggestedTags: ['arch:monolith', 'scale:mvp'],
      };

      const parsed = aiConvertDocumentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('debe validar la ratificación de documento por el arquitecto', () => {
      const payload = {
        canonicalPath: '06-knowledge-base/patterns/modular-monolith.md',
        verifiedBy: 'Nathaniel Muller San Martin',
        freshnessStatus: 'FRESH',
      };

      const parsed = verifyDocumentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });
});
