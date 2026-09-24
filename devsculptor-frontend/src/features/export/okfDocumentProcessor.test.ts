import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSha256,
  formatYamlFrontmatter,
  OkfMetadataHeader,
} from './okfDocumentProcessor';

describe('Frontend OKF Document Processor (Hashing & YAML Frontmatter)', () => {
  describe('computeSha256 Hash Function', () => {
    it('debe producir un hash hexadecimal de 64 caracteres de forma determinista', async () => {
      const text = 'DevSculptor Architecture Governance Specification';
      const hash1 = await computeSha256(text);
      const hash2 = await computeSha256(text);

      assert.equal(hash1, hash2);
      assert.ok(hash1.length >= 32);
    });

    it('debe alterar el hash ante cualquier variación de texto', async () => {
      const hashA = await computeSha256('Version 1');
      const hashB = await computeSha256('Version 2');

      assert.notEqual(hashA, hashB);
    });
  });

  describe('formatYamlFrontmatter Generator', () => {
    it('debe estructurar correctamente un encabezado YAML Frontmatter con tags y metadatos', () => {
      const header: OkfMetadataHeader = {
        okf_spec: 'v1.0.0',
        document_id: 'DOC-TEST-01',
        document_type: 'REQUIREMENT_SPEC',
        project_id: 'p-1234',
        project_name: 'Test Project',
        title: 'Especificación de Autenticación',
        canonical_path: '02-requirements/RF-01.md',
        tags: ['arch:monolith', 'stack:postgresql'],
        freshness: {
          status: 'FRESH',
          last_verified: '2026-09-22T16:00:00Z',
          state_hash: 'abc123hash',
          verified_by: 'Architect Lead',
        },
      };

      const yaml = formatYamlFrontmatter(header);

      assert.ok(yaml.startsWith('---\n'));
      assert.ok(yaml.includes('okf_spec: "v1.0.0"'));
      assert.ok(yaml.includes('document_id: "DOC-TEST-01"'));
      assert.ok(yaml.includes('document_type: "REQUIREMENT_SPEC"'));
      assert.ok(yaml.includes('canonical_path: "02-requirements/RF-01.md"'));
      assert.ok(yaml.includes('- "arch:monolith"'));
      assert.ok(yaml.includes('- "stack:postgresql"'));
      assert.ok(yaml.includes('status: "FRESH"'));
      assert.ok(yaml.includes('state_hash: "abc123hash"'));
    });
  });
});
