import type {
  ProjectSummary,
  ProjectDetail,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectMeta,
} from '@osce/shared';

const API_BASE = '/api';

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
  return res.json();
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.statusText}`);
  return res.json();
}

export async function createProject(req: ProjectCreateRequest): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.statusText}`);
  return res.json();
}

export async function updateProject(id: string, req: ProjectUpdateRequest): Promise<ProjectMeta> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Failed to update project: ${res.statusText}`);
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete project: ${res.statusText}`);
}

export async function readProjectFile(projectId: string, relativePath: string): Promise<string> {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${API_BASE}/projects/${projectId}/files/${encodedPath}`);
  if (!res.ok) throw new Error(`Failed to read file: ${res.statusText}`);
  const json = await res.json();
  return json.content;
}

export async function writeProjectFile(
  projectId: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${API_BASE}/projects/${projectId}/files/${encodedPath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: content,
  });
  if (!res.ok) throw new Error(`Failed to write file: ${res.statusText}`);
}

export async function deleteProjectFile(projectId: string, relativePath: string): Promise<void> {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${API_BASE}/projects/${projectId}/files/${encodedPath}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
}

export function exportProjectUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/export`;
}

export async function importProject(file: File): Promise<ProjectDetail> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/projects/import`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Failed to import project: ${res.statusText}`);
  return res.json();
}
