import { base44 } from '@/api/base44Client';

// Route privileged staff writes directly through the Supabase entity adapter
export async function staffWrite(entity, action, id, data) {
  const repo = base44.entities[entity];
  if (!repo) {
    throw new Error(`Unknown entity: ${entity}`);
  }

  switch (action) {
    case 'create':
      return await repo.create(data);
    case 'update':
      return await repo.update(id, data);
    case 'delete':
      return await repo.delete(id);
    default:
      throw new Error(`Unsupported staffWrite action: ${action}`);
  }