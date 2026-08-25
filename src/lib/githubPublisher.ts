import { parseSiteContent } from '../domain/schema'
import type { SiteContent } from '../domain/types'

const OWNER = import.meta.env.VITE_REPO_OWNER ?? 'akiradev-zero'
const REPO = import.meta.env.VITE_REPO_NAME ?? 'tierglide'
export const CONTENT_PATH = 'content/lists.json'
const API_ROOT = 'https://api.github.com'

export const TOKEN_SETUP_URL = 'https://github.com/settings/personal-access-tokens/new'
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`

const SESSION_KEY = 'tierglide.pat.session'
const PERSISTENT_KEY = 'tierglide.pat.persistent'

export class AuthError extends Error {
  constructor() {
    super('GitHub rejected the token — it may be expired, revoked, or lacking write access to this repository.')
    this.name = 'AuthError'
  }
}

export class ConflictError extends Error {
  constructor() {
    super('The published content changed on GitHub since you loaded it.')
    this.name = 'ConflictError'
  }
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(PERSISTENT_KEY)
}

export function storeToken(token: string, remember: boolean): void {
  clearStoredToken()
  if (remember) localStorage.setItem(PERSISTENT_KEY, token)
  else sessionStorage.setItem(SESSION_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(PERSISTENT_KEY)
}

function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function callApi(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  })
}

interface ContentFileResponse {
  sha: string
  content: string
}

interface PutContentResponse {
  content?: { sha?: string }
  commit?: { html_url?: string }
}

export interface ContentFile {
  content: SiteContent
  sha: string
}

/** Fetches the current lists.json from the repo. Also serves as token validation. */
export async function fetchContentFile(token: string): Promise<ContentFile> {
  const res = await callApi(`/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}`, token)
  if (res.status === 401 || res.status === 403) throw new AuthError()
  if (res.status === 404) {
    throw new Error(`Could not find ${CONTENT_PATH} in ${OWNER}/${REPO} — check the token's repository access.`)
  }
  if (!res.ok) throw new Error(`GitHub API error (HTTP ${res.status}).`)
  const data = (await res.json()) as ContentFileResponse
  const parsed = parseSiteContent(JSON.parse(decodeBase64Utf8(data.content)))
  return { content: parsed, sha: data.sha }
}

export interface PublishResult {
  commitUrl: string
}

/** Commits jsonText as the new lists.json. Throws ConflictError when the remote moved first. */
export async function putContentFile(
  token: string,
  jsonText: string,
  message: string,
  sha: string,
): Promise<PublishResult> {
  const res = await callApi(`/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}`, token, {
    method: 'PUT',
    body: JSON.stringify({ message, content: encodeBase64Utf8(jsonText), sha }),
  })
  if (res.status === 401 || res.status === 403) throw new AuthError()
  if (res.status === 409 || res.status === 422) throw new ConflictError()
  if (!res.ok) throw new Error(`GitHub API error (HTTP ${res.status}).`)
  const data = (await res.json()) as PutContentResponse
  return {
    commitUrl:
      data.commit?.html_url ??
      `https://github.com/${OWNER}/${REPO}/commits/main`,
  }
}
