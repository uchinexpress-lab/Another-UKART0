import { base44 } from '@/api/base44Client';

export async function staffWrite(entity, action, id, data) {
  const repo = base44.entities[entity];
  if (!repo) throw new Error('Unknown entity: ' + entity);
  if (action === 'create') return await repo.create(data);
  if (action === 'update') return await repo.update(id, data);
  if (action === 'delete') return await repo.delete(id);
  throw new Error('Unsupported staffWrite action: ' + action);
}
